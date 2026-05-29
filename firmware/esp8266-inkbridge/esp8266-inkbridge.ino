/**
 * InkBridge - InkOps Command ESP8266 墨水屏固件
 *
 * 功能:
 *   - 连接 Wi-Fi (STA 模式)
 *   - HTTP REST API 接收上位机推送的显示数据
 *   - 驱动 4.2 寸 Waveshare 墨水屏 (400x300, 黑白)
 *
 * 硬件: Waveshare E-Paper ESP8266 Driver Board
 * 编译: Arduino IDE + ESP8266 Board Package
 *
 * API:
 *   POST /api/display/frame    - 上传显示缓冲区 (RAW binary, 15000 字节)
 *   POST /api/display/refresh  - 执行屏幕刷新
 *   GET  /api/device/status    - 设备状态 (JSON)
 *   GET  /api/device/health    - 心跳检测
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <EEPROM.h>
#include "DEV_Config.h"
#include "EPD_4in2.h"

// ========== 可配置参数 ==========
const char* DEFAULT_SSID     = "sxc";
const char* DEFAULT_PASSWORD = "999lxjaini";

// EEPROM 地址布局
#define EEPROM_SIZE      512
#define EEPROM_MAGIC     0x00  // 2字节 magic number
#define EEPROM_SSID      0x02  // 32字节 SSID
#define EEPROM_PASS      0x22  // 32字节 密码
#define EEPROM_DEV_NAME  0x42  // 16字节 设备名
#define EEPROM_MAGIC_VAL 0xAB12

// 设备信息
char deviceName[16]   = "NODE-01";
char wifiSSID[32]     = "";
char wifiPass[32]     = "";
unsigned long bootTime = 0;
unsigned long lastRefreshTime = 0;
String deviceIP = "";

// 显示缓冲区 (400*300 像素, 每像素 1 位, MSB first)
#define DISP_WIDTH  400
#define DISP_HEIGHT 300
#define BUF_SIZE    ((DISP_WIDTH / 8) * DISP_HEIGHT)  // 15000 字节
uint8_t displayBuffer[BUF_SIZE] = {0};
bool bufferReady = false;

// HTTP 服务器
ESP8266WebServer server(80);

// ========== EEPROM 读写 ==========

void saveConfig() {
  EEPROM.begin(EEPROM_SIZE);
  // 写入 magic
  uint16_t magic = EEPROM_MAGIC_VAL;
  EEPROM.put(EEPROM_MAGIC, magic);

  char buf[32] = {0};
  strncpy(buf, wifiSSID, 31);
  EEPROM.put(EEPROM_SSID, buf);
  strncpy(buf, wifiPass, 31);
  EEPROM.put(EEPROM_PASS, buf);
  strncpy(buf, deviceName, 15);
  EEPROM.put(EEPROM_DEV_NAME, buf);

  EEPROM.commit();
  EEPROM.end();
  Serial.println("配置已保存到 EEPROM");
}

bool loadConfig() {
  EEPROM.begin(EEPROM_SIZE);
  uint16_t magic;
  EEPROM.get(EEPROM_MAGIC, magic);

  if (magic != EEPROM_MAGIC_VAL) {
    EEPROM.end();
    Serial.println("EEPROM 无有效配置, 使用默认值");
    return false;
  }

  char buf[32] = {0};
  EEPROM.get(EEPROM_SSID, buf);  strncpy(wifiSSID, buf, 31);
  EEPROM.get(EEPROM_PASS, buf);  strncpy(wifiPass, buf, 31);
  EEPROM.get(EEPROM_DEV_NAME, buf); strncpy(deviceName, buf, 15);
  EEPROM.end();

  Serial.printf("从 EEPROM 加载配置: SSID=%s, 设备=%s\n", wifiSSID, deviceName);
  return true;
}

// ========== Wi-Fi 连接 ==========

bool connectWiFi() {
  Serial.printf("连接 Wi-Fi: %s ...\n", wifiSSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID, wifiPass);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    deviceIP = WiFi.localIP().toString();
    Serial.printf("\nWi-Fi 已连接! IP: %s\n", deviceIP.c_str());

    // 设置主机名 (mDNS)
    WiFi.hostname(deviceName);
    return true;
  }

  Serial.println("\nWi-Fi 连接失败!");
  return false;
}

// ========== 墨水屏初始化 ==========

void initDisplay() {
  Serial.println("初始化墨水屏...");

  // 初始化 GPIO (软 SPI)
  GPIO_Config();

  // 初始化并清屏
  EPD_4IN2_Init_Fast();
  EPD_4IN2_Clear();
  delay(100);

  Serial.println("墨水屏就绪");
}

// ========== HTTP API 处理 ==========

/// GET /api/device/status - 返回设备状态 JSON
void handleStatus() {
  String mac = WiFi.macAddress();
  char json[512];
  snprintf(json, sizeof(json),
    "{"
    "\"id\":\"%s\","
    "\"name\":\"%s\","
    "\"ip\":\"%s\","
    "\"model\":\"4.2inch-e-paper\","
    "\"firmwareVersion\":\"inkbridge-0.1.0\","
    "\"status\":\"online\","
    "\"bufferReady\":%s,"
    "\"uptime\":%lu,"
    "\"lastRefreshAt\":%lu,"
    "\"lastRefreshAgo\":%lu"
    "}",
    mac.c_str(),
    deviceName,
    deviceIP.c_str(),
    bufferReady ? "true" : "false",
    millis() / 1000,
    lastRefreshTime,
    lastRefreshTime > 0 ? (millis() / 1000) - lastRefreshTime : 0
  );

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

/// GET /api/device/health - 心跳检测
void handleHealth() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "OK");
}

/// POST /api/display/frame - 接收显示缓冲区 (RAW binary body)
void handleFrame() {
  if (server.method() != HTTP_POST) {
    server.send(405, "text/plain", "Method Not Allowed");
    return;
  }

  // ESP8266WebServer 在调用 handler 前已将 body 存入 arg("plain")
  const String& body = server.arg("plain");
  size_t bodyLen = body.length();

  if (bodyLen != BUF_SIZE) {
    char msg[128];
    snprintf(msg, sizeof(msg),
      "Invalid data size: %d bytes. Expected exactly %d bytes.",
      (int)bodyLen, BUF_SIZE);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(400, "text/plain", msg);
    Serial.printf("帧数据大小错误: %d (期望 %d)\n", (int)bodyLen, BUF_SIZE);
    return;
  }

  memcpy(displayBuffer, body.c_str(), BUF_SIZE);
  bufferReady = true;
  Serial.printf("帧数据接收成功: %d 字节\n", BUF_SIZE);

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json",
    "{\"status\":\"ok\",\"bytesReceived\":" + String(BUF_SIZE) + "}");
}

/// POST /api/display/refresh - 执行屏幕刷新
void handleRefresh() {
  if (!bufferReady) {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(400, "text/plain", "No frame data loaded. POST /api/display/frame first.");
    return;
  }

  Serial.println("开始刷新屏幕...");

  // 初始化快速刷新模式
  EPD_4IN2_Init_Fast();

  // 写入显示缓冲区
  EPD_4IN2_Display(displayBuffer);

  // 刷新后进入低功耗睡眠，延长屏幕寿命
  EPD_4IN2_Sleep();

  // 记录时间
  lastRefreshTime = millis() / 1000;
  bufferReady = false;

  Serial.println("屏幕刷新完成");

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json",
    "{\"status\":\"ok\",\"message\":\"display refreshed\"}");
}

/// POST /api/device/config - 配置设备参数
void handleConfig() {
  if (server.method() != HTTP_POST) {
    server.send(405, "text/plain", "Method Not Allowed");
    return;
  }

  // 解析简单 JSON: {"ssid":"...", "password":"...", "name":"..."}
  String body = server.arg("plain");

  // 极简 JSON 解析 (避免 ArduinoJson 依赖)
  String newSSID, newPass, newName;

  auto extract = [&body](const char* key, String& out) -> bool {
    String search = "\"" + String(key) + "\":\"";
    int start = body.indexOf(search);
    if (start < 0) return false;
    start += search.length();
    int end = body.indexOf("\"", start);
    if (end < 0) return false;
    out = body.substring(start, end);
    return true;
  };

  bool changed = false;
  if (extract("ssid", newSSID)) {
    strncpy(wifiSSID, newSSID.c_str(), 31);
    changed = true;
    Serial.printf("SSID 已更新: %s\n", wifiSSID);
  }
  if (extract("password", newPass)) {
    strncpy(wifiPass, newPass.c_str(), 31);
    changed = true;
    Serial.println("密码已更新");
  }
  if (extract("name", newName)) {
    strncpy(deviceName, newName.c_str(), 15);
    changed = true;
    Serial.printf("设备名已更新: %s\n", deviceName);
  }

  if (changed) {
    saveConfig();
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json",
      "{\"status\":\"ok\",\"message\":\"config saved, restarting...\"}");
    delay(500);
    ESP.restart();
    return;
  }

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json",
    "{\"status\":\"ok\",\"message\":\"config updated (no changes)\"}");
}

/// CORS 预检 (OPTIONS)
void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204, "text/plain", "");
}

// ========== 启动 ==========

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n\n══════════════════════════════");
  Serial.println("  InkBridge Firmware v0.1.0");
  Serial.println("  InkOps Command - ESP8266");
  Serial.println("══════════════════════════════");

  bootTime = millis() / 1000;

  // 1. 加载配置
  if (!loadConfig()) {
    // 首次启动: 使用默认配置
    strncpy(wifiSSID, DEFAULT_SSID, 31);
    strncpy(wifiPass, DEFAULT_PASSWORD, 31);
  }

  // 2. 连接 Wi-Fi
  if (!connectWiFi()) {
    // Wi-Fi 连接失败, 仍启动服务器 (可用串口调试)
    Serial.println("Wi-Fi 不可用, 仅本地调试模式");
  }

  // 3. 初始化墨水屏
  initDisplay();

  // 4. 显示启动画面 (可选: 发送一张启动卡)
  // 此处留空, 上位机首次连接后会推送页面

  // 5. 注册 HTTP 路由
  server.on("/api/device/status", handleStatus);
  server.on("/api/device/health", handleHealth);
  server.on("/api/display/frame", HTTP_POST, handleFrame);
  server.on("/api/display/frame", HTTP_OPTIONS, handleOptions);
  server.on("/api/display/refresh", HTTP_POST, handleRefresh);
  server.on("/api/display/refresh", HTTP_OPTIONS, handleOptions);
  server.on("/api/device/config", HTTP_POST, handleConfig);
  server.on("/api/device/config", HTTP_OPTIONS, handleOptions);

  // 404
  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(404, "application/json", "{\"error\":\"not found\"}");
  });

  server.begin();
  Serial.println("HTTP 服务器已启动 (端口 80)");
  Serial.printf("设备名: %s | IP: %s\n", deviceName, deviceIP.c_str());
}

// ========== 主循环 ==========

void loop() {
  // Wi-Fi 断线自动重连 (非阻塞, 每 30 秒尝试一次)
  static unsigned long lastReconnect = 0;
  if (WiFi.status() != WL_CONNECTED && millis() - lastReconnect > 30000) {
    lastReconnect = millis();
    Serial.println("[重连] Wi-Fi 断线, 发起重连...");
    WiFi.reconnect();
  }

  server.handleClient();

  // 每 60 秒输出一次心跳日志
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 60000) {
    lastHeartbeat = millis();
    Serial.printf("[心跳] 运行时间: %lu 秒 | 空闲内存: %d 字节\n",
      millis() / 1000, ESP.getFreeHeap());
  }
}
