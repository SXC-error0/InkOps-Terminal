# InkOps Terminal — 设备通信协议 V1.0

## InkBridge 设备 API

上位机与 ESP8266 墨水屏设备通过 HTTP 局域网通信。

### 设备基础信息

| 项目 | 说明 |
|------|------|
| 型号 | Waveshare E-Paper ESP8266 Driver Board |
| 屏幕 | 4.2 英寸 E-Ink | 400×300 |
| 颜色 | 黑白 (1-bit) |
| 通信 | HTTP (Wi-Fi) |
| 默认 IP | 192.168.10.211 (Loader 固件) |

---

## 端点设计

### 1. 设备状态

```http
GET /api/device/status
```

响应:
```json
{
  "device_name": "NODE-01",
  "screen_size": "400x300",
  "firmware_version": "0.1.0",
  "last_refresh": "2026-05-28T14:00:00Z",
  "status": "online"
}
```

### 2. 健康心跳

```http
GET /api/device/health
```

响应: `200 OK` 表示设备正常。

### 3. 上传帧数据

```http
POST /api/display/frame
Content-Type: application/octet-stream

<15000 bytes raw 1-bit bitmap>
```

**帧格式**: 
- 400 × 300 像素, 1-bit 黑白
- 每字节 8 像素 (MSB 优先)
- 逐行排列: 50 字节一行 × 300 行 = 15000 字节
- 上位机通过 `Renderer.to_bitmap()` 生成

### 4. 执行刷新

```http
POST /api/display/refresh
```

触发屏幕刷新 (写入帧数据后调用)。

### 5. 配置设备

```http
POST /api/device/config
Content-Type: application/json

{
  "device_name": "NODE-01",
  "wifi_ssid": "MyWiFi",
  "wifi_password": "password",
  "host_ip": "192.168.1.100",
  "host_port": 8700
}
```

---

## 首次配网流程

```
ESP8266 上电 → 创建热点 INKOPS-NODE-01
  → 上位机连接到热点
    → POST /api/device/config (配网信息)
      → ESP8266 连接 Wi-Fi, 切换到 Station 模式
        → 启动 HTTP 服务器
          → 上位机发现设备心跳
            → 推送绑定成功页面
```

---

## 帧数据格式详解

上位机生成原始位图:
```python
from app.render.quest_scroll import get_quest_renderer

renderer = get_quest_renderer()
img = renderer.create_canvas()
# ... 绘制模板内容 ...
bitmap = renderer.to_bitmap(img)   # bytes[15000]
```

ESP8266 接收端:
```cpp
// 接收 15000 字节帧数据
uint8_t framebuffer[15000];
// ... HTTP 接收 ...
display.drawBitmap(framebuffer);  // 写入 EPD
display.display();                // 刷新屏幕
```

---

## 当前阶段 (第一阶段)

MVP 阶段使用微雪官方的 Loader 固件:
1. 上位机生成 PNG 图片
2. 通过 `Loader.ino` 的 HTML 上传接口手动推送
3. 后续阶段升级为自定义 InkBridge 固件实现自动推送
