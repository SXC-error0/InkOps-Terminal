# InkBridge - ESP8266 墨水屏固件

InkOps Command 的自定义 ESP8266 固件，用于接收上位机推送的显示数据并驱动 4.2 寸墨水屏。

## 硬件要求

- Waveshare E-Paper ESP8266 Driver Board
- 4.2 寸黑白墨水屏 (400 × 300)

## Arduino IDE 编译

### 1. 安装 ESP8266 Board Package

Arduino IDE → 首选项 → 附加开发板管理器网址:
```
https://arduino.esp8266.com/stable/package_esp8266com_index.json
```

工具 → 开发板 → 开发板管理器 → 搜索 `esp8266` → 安装

### 2. 打开项目

1. Arduino IDE → 文件 → 打开 → 选择 `esp8266-inkbridge.ino`
2. 确保同目录下的 `.cpp` 和 `.h` 文件作为标签页打开:
   - `esp8266-inkbridge.ino` (主程序)
   - `DEV_Config.h` / `DEV_Config.cpp` (GPIO/SPI 底层)
   - `EPD_4in2.h` / `EPD_4in2.cpp` (墨水屏驱动)
   - `Debug.h` (调试宏)

### 3. 配置 Wi-Fi

首次启动会使用默认配置:

```cpp
const char* DEFAULT_SSID     = "INKOPS-NET";
const char* DEFAULT_PASSWORD = "inkops123";
```

可通过 HTTP API 在线修改。

### 4. 编译上传

1. 选择开发板: `Generic ESP8266 Module`
2. 选择端口: 对应 ESP8266 的串口
3. 点击上传

## HTTP API

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/device/status` | 设备状态 (JSON) |
| `GET` | `/api/device/health` | 心跳检测, 返回 `OK` |
| `POST` | `/api/display/frame` | 上传显示缓冲区 (RAW binary, 15000 字节) |
| `POST` | `/api/display/refresh` | 执行屏幕刷新 |
| `POST` | `/api/device/config` | 配置设备参数 |

### 帧上传协议

请求体为 **原始二进制数据**:
- 格式: 1 位/像素, MSB first, 按行排列
- 尺寸: (400 / 8) × 300 = 15000 字节
- 白色(背景) = 0, 黑色(前景) = 1

```bash
# 示例: 用 curl 上传并刷新
curl -X POST --data-binary @frame.bin http://192.168.1.100/api/display/frame
curl -X POST http://192.168.1.100/api/display/refresh
```

### 设备状态响应

```json
{
  "id": "NODE-01",
  "name": "NODE-01",
  "ip": "192.168.1.100",
  "model": "4.2inch-e-paper",
  "firmwareVersion": "inkbridge-0.1.0",
  "status": "online",
  "bufferReady": true,
  "uptime": 3600,
  "lastRefreshAt": 3500,
  "lastRefreshAgo": 100
}
```

### 在线配置

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"ssid":"MyWiFi","password":"mypassword","name":"NODE-02"}' \
  http://192.168.1.100/api/device/config
```

配置会保存到 EEPROM，重启后自动加载。

## 与上位机协作

上位机 (Tauri desktop app) 自动检测固件类型:
- 如果 `/api/device/health` 返回 200 → 使用 InkBridge 协议 (RAW binary)
- 否则 → 回退到 Waveshare Loader 协议 (hex 编码)

## 目录结构

```
firmware/esp8266-inkbridge/
├── esp8266-inkbridge.ino    # 主固件
├── DEV_Config.h             # GPIO 和 SPI 底层配置
├── DEV_Config.cpp
├── EPD_4in2.h               # 4.2 寸墨水屏驱动 (Waveshare)
├── EPD_4in2.cpp
├── Debug.h                  # 调试宏
└── README.md
```
