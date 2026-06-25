/**
 * InkBridge - InkOps Command ESP8266 e-ink firmware
 *
 * Features:
 *   - Wi-Fi STA mode
 *   - HTTP REST API for receiving display data from host
 *   - Drives 4.2" Waveshare e-paper (400x300, B&W)
 *
 * Hardware: Waveshare E-Paper ESP8266 Driver Board
 * Build:    Arduino IDE + ESP8266 Board Package
 *
 * API:
 *   POST /api/display/frame    - Upload frame buffer (RAW binary, 15000 bytes)
 *   POST /api/display/refresh  - Refresh the screen
 *   GET  /api/device/status    - Device status (JSON)
 *   GET  /api/device/health    - Heartbeat
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <EEPROM.h>
#include "DEV_Config.h"
#include "EPD_4in2.h"

// ========== Config ==========
const char* DEFAULT_SSID     = "ZKXT";
const char* DEFAULT_PASSWORD = "zkxt7858";

// EEPROM layout
#define EEPROM_SIZE      512
#define EEPROM_MAGIC     0x00  // 2 bytes magic number
#define EEPROM_SSID      0x02  // 32 bytes SSID
#define EEPROM_PASS      0x22  // 32 bytes password
#define EEPROM_DEV_NAME  0x42  // 32 bytes device name
#define EEPROM_MAGIC_VAL 0xAB12

// Device info
char deviceName[16]   = "NODE-01";
char wifiSSID[32]     = "";
char wifiPass[32]     = "";
unsigned long bootTime = 0;
unsigned long lastRefreshTime = 0;
String deviceIP = "";

// Frame buffer (400*300 px, 1 bit/pixel, MSB first)
#define DISP_WIDTH  400
#define DISP_HEIGHT 300
#define BUF_SIZE    ((DISP_WIDTH / 8) * DISP_HEIGHT)  // 15000 bytes
uint8_t displayBuffer[BUF_SIZE] = {0};
bool bufferReady = false;

// HTTP server
ESP8266WebServer server(80);

// ========== EEPROM ==========

void saveConfig() {
  EEPROM.begin(EEPROM_SIZE);
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
  Serial.println("[EEPROM] Config saved.");
}

bool loadConfig() {
  EEPROM.begin(EEPROM_SIZE);
  uint16_t magic;
  EEPROM.get(EEPROM_MAGIC, magic);

  if (magic != EEPROM_MAGIC_VAL) {
    EEPROM.end();
    Serial.println("[EEPROM] No valid config, using defaults.");
    return false;
  }

  char buf[32] = {0};
  EEPROM.get(EEPROM_SSID, buf);     strncpy(wifiSSID,   buf, 31); wifiSSID[31]   = '\0';
  EEPROM.get(EEPROM_PASS, buf);     strncpy(wifiPass,   buf, 31); wifiPass[31]   = '\0';
  EEPROM.get(EEPROM_DEV_NAME, buf); strncpy(deviceName, buf, 15); deviceName[15] = '\0';
  EEPROM.end();

  Serial.printf("[EEPROM] Loaded: SSID=%s, device=%s\n", wifiSSID, deviceName);
  return true;
}

// ========== Wi-Fi ==========

bool connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s ...\n", wifiSSID);

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
    Serial.printf("\n[WiFi] Connected! IP: %s\n", deviceIP.c_str());
    WiFi.hostname(deviceName);
    return true;
  }

  Serial.println("\n[WiFi] Connection failed!");
  return false;
}

// ========== Display ==========

void initDisplay() {
  Serial.println("[EPD] Initializing...");
  GPIO_Config();
  EPD_4IN2_Init_Fast();
  EPD_4IN2_Clear();
  delay(100);
  Serial.println("[EPD] Ready.");
}

// ========== HTTP handlers ==========

/// GET /api/device/status
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

/// GET /api/device/health
void handleHealth() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "OK");
}

/// POST /api/display/frame
void handleFrame() {
  if (server.method() != HTTP_POST) {
    server.send(405, "text/plain", "Method Not Allowed");
    return;
  }

  // ESP8266WebServer stores POST body in arg("plain") before calling handler
  const String& body = server.arg("plain");
  size_t bodyLen = body.length();

  if (bodyLen != BUF_SIZE) {
    char msg[128];
    snprintf(msg, sizeof(msg),
      "Invalid data size: %d bytes. Expected exactly %d bytes.",
      (int)bodyLen, BUF_SIZE);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(400, "text/plain", msg);
    Serial.printf("[Frame] Size error: %d (expected %d)\n", (int)bodyLen, BUF_SIZE);
    return;
  }

  memcpy(displayBuffer, body.c_str(), BUF_SIZE);
  bufferReady = true;
  Serial.printf("[Frame] Received %d bytes OK.\n", BUF_SIZE);

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json",
    "{\"status\":\"ok\",\"bytesReceived\":" + String(BUF_SIZE) + "}");
}

/// POST /api/display/refresh
void handleRefresh() {
  if (!bufferReady) {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(400, "text/plain", "No frame data. POST /api/display/frame first.");
    return;
  }

  Serial.println("[EPD] Refreshing...");
  EPD_4IN2_Init_Fast();
  EPD_4IN2_Display(displayBuffer);
  EPD_4IN2_Sleep();

  lastRefreshTime = millis() / 1000;
  bufferReady = false;
  Serial.println("[EPD] Refresh done.");

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json",
    "{\"status\":\"ok\",\"message\":\"display refreshed\"}");
}

/// POST /api/device/config
void handleConfig() {
  if (server.method() != HTTP_POST) {
    server.send(405, "text/plain", "Method Not Allowed");
    return;
  }

  String body = server.arg("plain");
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
    strncpy(wifiSSID, newSSID.c_str(), 31); wifiSSID[31] = '\0';
    changed = true;
    Serial.printf("[Config] SSID updated: %s\n", wifiSSID);
  }
  if (extract("password", newPass)) {
    strncpy(wifiPass, newPass.c_str(), 31); wifiPass[31] = '\0';
    changed = true;
    Serial.println("[Config] Password updated.");
  }
  if (extract("name", newName)) {
    strncpy(deviceName, newName.c_str(), 15); deviceName[15] = '\0';
    changed = true;
    Serial.printf("[Config] Device name updated: %s\n", deviceName);
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

/// OPTIONS (CORS preflight)
void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204, "text/plain", "");
}

// ========== Setup ==========

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n\n==============================");
  Serial.println("  InkBridge Firmware v0.1.0");
  Serial.println("  InkOps Command - ESP8266");
  Serial.println("==============================");

  bootTime = millis() / 1000;

  if (!loadConfig()) {
    strncpy(wifiSSID, DEFAULT_SSID, 31);
    strncpy(wifiPass, DEFAULT_PASSWORD, 31);
  }

  if (!connectWiFi()) {
    Serial.println("[WiFi] Unavailable, running in debug mode.");
  }

  initDisplay();

  server.on("/api/device/status",   handleStatus);
  server.on("/api/device/health",   handleHealth);
  server.on("/api/display/frame",   HTTP_POST,    handleFrame);
  server.on("/api/display/frame",   HTTP_OPTIONS, handleOptions);
  server.on("/api/display/refresh", HTTP_POST,    handleRefresh);
  server.on("/api/display/refresh", HTTP_OPTIONS, handleOptions);
  server.on("/api/device/config",   HTTP_POST,    handleConfig);
  server.on("/api/device/config",   HTTP_OPTIONS, handleOptions);

  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(404, "application/json", "{\"error\":\"not found\"}");
  });

  server.begin();
  Serial.println("[HTTP] Server started on port 80.");
  Serial.printf("[HTTP] Device: %s | IP: %s\n", deviceName, deviceIP.c_str());
}

// ========== Loop ==========

void loop() {
  // Non-blocking Wi-Fi reconnect, retry every 30s
  static unsigned long lastReconnect = 0;
  if (WiFi.status() != WL_CONNECTED && millis() - lastReconnect > 30000) {
    lastReconnect = millis();
    Serial.println("[WiFi] Disconnected, reconnecting...");
    WiFi.reconnect();
  }

  server.handleClient();

  // Heartbeat log every 60s
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 60000) {
    lastHeartbeat = millis();
    Serial.printf("[Heartbeat] Uptime: %lus | Free heap: %d bytes\n",
      millis() / 1000, ESP.getFreeHeap());
  }
}
