# InkOps Terminal｜开发计划 V1.0

> **项目定位**：一台由 AI 驱动、通过 4.2 寸电子墨水屏展示关键信息的独立开发者桌面作战终端。  
> **硬件基础**：4.2 寸墨水屏 + Waveshare E-Paper ESP8266 Driver Board，已通过官方示例点亮并完成内容更新。  
> **建立日期**：2026-05-28  
> **当前阶段**：Planning → Prototype Validation

---

## 1. 开发目标

### 1.1 一句话目标

将已可刷新内容的墨水屏，升级为一个由 AI 管理信息优先级的现实桌面终端：**任务变成副本、提交变成战绩、异常变成警报、留言变成纸面信号、发布变成头版新闻。**

### 1.2 第一版成功标准

满足以下条件，即认为 `V1.0 Demo Release` 成功：

1. 桌面上位机可生成并预览至少 6 种统一风格的 400 × 300 墨水页面；
2. AI 能将任务、项目进度、服务异常、留言转换为经过字段约束的单页内容；
3. 页面能够稳定刷新到真实墨水屏；
4. 指定网站/API 离线时，上位机能触发告警候选页并推送上屏；
5. 朋友手机扫码提交一句留言后，能生成纸感明信片页面；
6. 能录制一条完整展示“任务 → 状态 → 告警 → 留言 → 战报”的演示视频；
7. 仓库包含 README、开发计划、技术架构与运行说明，不包含任何 API Key 或私人数据。

### 1.3 设计原则

| 原则 | 说明 |
| --- | --- |
| 一页胜过一个后台 | 墨水屏同时只展示当前最有价值的一页 |
| AI 不是聊天框 | AI 用于判断、压缩、解释、生成结构化页面内容 |
| 刷新必须有意义 | 不做高频动画与无意义轮播，仅在值得注意时刷新 |
| 先展示闭环，再扩模块 | 第一版先完成六模块可演示流程 |
| 固定模板保障可读性 | AI 不自由排版，页面由模板引擎渲染 |

---

## 2. 产品功能范围

## 2.1 MVP 功能冻结

| MVP 模块 | 用户看到的效果 | 关键实现 | 验收方式 |
| --- | --- | --- | --- |
| **Command Bridge** | 上位机首页显示屏幕预览、推荐页面、设备状态与事件流 | 统一页面中心、推送入口、事件时间线 | 能从首页预览并发送页面 |
| **AI Daily Quest** | RPG 主线、支线、Boss、奖励与禁令 | 大模型结构化输出 + `QUEST_SCROLL` 模板 | 输入待办后实屏显示任务卡 |
| **Launch Control** | 产品进度、阻塞项、今日唯一指令、倒计时 | 项目里程碑管理 + AI 优先级分析 | 输出当前最阻塞上线任务 |
| **Terminal Status** | 当前项目、GitHub Commit、服务状态与宣言 | GitHub 接口 + `TERMINAL_STATUS` 模板 | 可显示仓库活动摘要 |
| **System Watcher** | 网站/API/设备在线状态；异常为警报页面 | HTTP 健康检测 + 告警事件 | 主动停服务后生成告警页 |
| **Signal Box** | 好友扫码留言，屏幕显示电报/明信片 | H5 留言入口 + QRCode + 内容审核 | 手机留言成功展示到屏幕 |

## 2.2 后续功能 Backlog

| 模块 | 价值 | 预计版本 |
| --- | --- | --- |
| Token 燃烧告示牌 | API 使用消耗与真实产出对比，传播效果强 | V1.1 |
| 发布战报报纸 | 上线时生成仪式化头版页面 | V1.1 |
| 自动刷新规则中心 | 设置定时显示、覆盖规则与固定页 | V1.1 |
| 收入战报 / 网站访客牌 | 对接个人产品变现与运营 | V2.0 |
| 今日接单营业牌 / 客户雷达 | 个人服务与咨询跟进 | V2.0 |
| AI Bug 悬赏令 | 将报错变成唯一排查任务 | V2.0 |
| AI 宠物情绪牌 | 与 ElectronPet 联动 | V3.0 |
| 知识抽卡 / 面试挑战 | 技术学习反馈 | V3.0 |
| 交易纪律警示牌 | 规则提醒，不用于保证收益 | V3.0 |
| 城市探索 / 健身属性页 | 扩展生活玩法 | V3.0 |

## 2.3 MVP 明确不做

- 不让 ESP8266 本地运行 AI；
- 不展示实时行情 K 线，不做自动交易；
- 不把首版做成庞大的账号/云同步平台；
- 不首版联动 ElectronPet 舵机与语音；
- 不让 AI 任意生成页面布局；
- 不因新增创意打断第一版交付节奏。

---

## 3. 核心机制：AI Display Director

## 3.1 机制说明

Quest、Launch、Terminal、Watcher 与 Signals 都会产生候选页面，但实体屏幕同一时刻只能显示一个页面。`AI Display Director` 负责选择或推荐当前值得显示的页面。

MVP 采用 **规则决定刷新优先级 + AI 负责内容表达和建议理由 + 用户可确认推送** 的稳定模式；告警可启用自动覆盖选项。

## 3.2 页面优先级

| 级别 | 内容类型 | 事件示例 | MVP 行为 |
| ---: | --- | --- | --- |
| P0 | 紧急异常 | 网站、API 或设备离线 | 生成告警页面；开启自动模式时立即覆盖 |
| P1 | 关键成果 | 产品发布、首次用户反馈 | 生成里程碑页并推荐展示 |
| P2 | 日常核心页面 | 早晨任务卷轴、晚上结算 | 定时生成，默认推荐 |
| P3 | 社交互动 | 新留言 | 加入候选队列，用户确认后展示 |
| P4 | 轻内容 | 知识卡、宠物页 | 后续版本启用 |
| P5 | 待机页面 | 黑客风终端状态页 | 无其他事件时常驻 |

## 3.3 候选页面对象

```json
{
  "page_type": "SYSTEM_ALERT",
  "priority": 0,
  "urgency": "critical",
  "interruptible": false,
  "expires_at": null,
  "template": "SYSTEM_ALERT",
  "trigger_source": "monitor:xzspace.tech",
  "reason": "公网站点不可访问，影响产品展示。",
  "payload": {
    "service": "xzspace.tech",
    "status": "OFFLINE",
    "first_action": "检查 Nginx 站点与服务状态",
    "checked_at": "2026-05-28T14:05:00+09:00"
  }
}
```

---

## 4. 上位机设计

## 4.1 一级导航结构

| 页面 | 负责内容 | MVP |
| --- | --- | ---: |
| **Bridge** | 总指挥舱、屏幕预览、AI 推荐、发送、事件流 | 必做 |
| **Quest** | 今日任务录入、卷轴生成、任务结算 | 必做 |
| **Launch** | 产品目标、里程碑、阻塞项与倒计时 | 必做 |
| **Terminal** | 项目与 GitHub 状态终端 | 必做 |
| **Watcher** | 服务与设备检测、异常记录 | 必做 |
| **Signals** | 二维码留言、明信片预览与审核 | 必做 |
| **Studio** | 模板选择、页面历史、图片导出 | 必做 |
| **Device** | 设备连接、刷新测试、参数设置 | 必做 |
| Automation | 自动刷新、页面优先级、自定义规则 | V1.1 |
| Reports | Token、发布、收入和流量战报 | V1.1 / V2.0 |
| Companion | ElectronPet 联动 | V3.0 |

## 4.2 Bridge｜总指挥舱

### 页面目标

让用户打开软件即看到三件事：

1. 墨水屏现在显示什么；
2. AI 建议下一页展示什么以及原因；
3. 今天发生了哪些值得记录的事件。

### 布局草案

```text
┌────────────────────────────────────────────────────────────────────┐
│ INKOPS TERMINAL            NODE-01 ONLINE         AI READY          │
├──────────────┬─────────────────────────────────┬───────────────────┤
│ NAVIGATION   │     E-PAPER LIVE PREVIEW        │ AI BRIEFING       │
│ Bridge       │ ┌─────────────────────────────┐ │ 推荐：每日任务卷轴 │
│ Quest        │ │ DAILY QUEST / LV.01         │ │                   │
│ Launch       │ │ BOSS: 需求膨胀             │ │ 理由：尚未确定今日 │
│ Terminal     │ │ HP: ██████░░░░             │ │ 唯一交付目标       │
│ Watcher      │ │ MAIN: 完成自动刷新接口       │ │                   │
│ Signals      │ └─────────────────────────────┘ │ [ACCEPT] [IGNORE] │
│ Device       │ [GENERATE] [PUSH] [PIN PAGE]   │                   │
├──────────────┴─────────────────────────────────┴───────────────────┤
│ EVENT STREAM: 08:30 QUEST READY | 10:12 DEVICE ONLINE | 14:05 ALERT│
└────────────────────────────────────────────────────────────────────┘
```

### 必须能力

- 显示设备在线与最近刷新时间；
- 显示当前已发送页面和待发送页面；
- 支持生成、推送、固定、重新展示历史页；
- 显示 AI 推荐理由；
- 展示当天事件时间线。

## 4.3 Quest｜AI 每日任务卷轴

### 用户输入

| 字段 | 说明 |
| --- | --- |
| 日期 | 默认今日 |
| 今天必须完成什么 | 自由文字输入 |
| 可选支线 | 健身、学习、杂事等 |
| 交付标准 | 页面上线、接口调通、提交代码等 |
| 今日禁止事项 | 不开新坑、不改配色等 |
| AI 人格 | 公会任务官 / 黑客教官 / 舰桥副官 / 毒舌监督者 |

### AI 输出字段

| 字段 | 字数约束 |
| --- | ---: |
| 主线任务 | 24 字以内 |
| 支线任务 | 最多 2 条，每条 18 字以内 |
| Boss 名称 | 12 字以内 |
| Boss 弱点 | 20 字以内 |
| 今日禁令 | 24 字以内 |
| 奖励 | 20 字以内 |
| 结尾宣言 | 24 字以内 |

### 墨水页示例

```text
DAILY QUEST / LV.01
────────────────────────
MAIN QUEST
完成墨水屏自动推送接口

SIDE QUEST
□ 修复留言二维码入口
□ 完成一次力量训练

BOSS: 需求膨胀魔王
WEAKNESS: 先交付，再增加

REWARD: 解锁首支演示视频
```

## 4.4 Launch｜产品上线发射台

| 业务字段 | 说明 |
| --- | --- |
| 产品名称 | 当前正在推进的产品 |
| 目标版本 | 例如 V0.1 Prototype |
| 上线时间 | 用户设置的目标时间 |
| 已完成项 | 可验收功能列表 |
| 阻塞项 | 未完成且影响发布的任务 |
| AI 指令 | 今日唯一关键行动 |

AI 重点能力：识别“继续改视觉、继续找灵感、继续加功能”等伪优化，优先给出真正影响发布的下一步。

## 4.5 Terminal｜黑客风个人作战终端

| 数据项 | MVP 来源 | 展示方式 |
| --- | --- | --- |
| 当前项目名 | 用户配置 | 标题区域 |
| 当前仓库 | 用户配置 | 状态字段 |
| 今日提交数 | GitHub API | 终端指标 |
| 最近提交摘要 | GitHub API + AI 压缩 | 一行成果说明 |
| 服务在线状态 | Watcher | ONLINE / OFFLINE |
| MVP 完成度 | Launch | 进度条 |
| 宣言 | AI 生成或锁定 | 命令行结尾 |

## 4.6 Watcher｜服务器守夜人

### MVP 监控对象

- 用户配置的网站 URL；
- FastAPI 本地后端；
- 墨水屏设备健康检查接口；
- 可选 MQTT Broker 端口连通性。

### 告警页面内容

- 故障对象；
- 告警等级；
- 当前影响；
- AI 生成的第一检查动作；
- 最后检测时间；
- 服务恢复后的恢复卡片。

## 4.7 Signals｜异步电子明信片

### 流程

1. 上位机生成留言入口二维码；
2. 访客扫码访问移动端页面；
3. 输入一句话和可选昵称；
4. 后端保存待审核留言；
5. AI 进行违规过滤、隐私处理与适配屏幕的压缩；
6. 用户确认上屏或按规则进入展示队列；
7. 页面记录进入历史档案。

### 安全约束

- 留言正文最长 80 字；
- 默认不采集或展示不必要身份信息；
- MVP 默认人工确认后推送；
- 页面生成失败时原文不上屏。

---

## 5. 墨水屏模板系统

## 5.1 页面规格

| 项目 | 约束 |
| --- | --- |
| 画布尺寸 | 400 × 300 px |
| 首版颜色 | 黑白二值图 |
| 排版方向 | 高对比、大标题、少段落、强留白 |
| 页面内容上限 | 不超过 5 个核心信息块 |
| 字体渲染 | 在 Python 侧渲染为图片，不依赖设备中文字库 |
| 二维码 | 留言或详情入口可选，必须实机测试扫码成功率 |
| 页面归档 | PNG 图片与结构化 JSON 均保存 |

## 5.2 MVP 模板

| Template ID | 使用场景 | 信息结构 |
| --- | --- | --- |
| `QUEST_SCROLL` | AI 每日任务卷轴 | 主线、支线、Boss、弱点、奖励 |
| `TERMINAL_STATUS` | 黑客终端 | 项目、提交、服务状态、宣言 |
| `LAUNCH_PANEL` | 产品发射台 | 进度、阻塞、倒计时、指令 |
| `SYSTEM_ALERT` | 服务器守夜人 | 故障、影响、第一动作、检测时间 |
| `POSTCARD` | 异步电子明信片 | 短留言、署名、时间、二维码可选 |
| `RELEASE_NEWS` | 发布/开发战报 | 头条、成果摘要、下一步 |

## 5.3 渲染链路

```text
用户输入 / 系统事件 / GitHub 数据
              ↓
AI 生成结构化 Payload
              ↓
Pydantic 校验字段、类型、字数与内容风险
              ↓
固定页面模板 + Pillow 渲染
              ↓
黑白二值化 / 抖动处理 + 400 × 300 PNG
              ↓
上位机实时预览 + 页面历史归档
              ↓
推送或导出到 ESP8266 墨水屏
```

---

## 6. 技术选型与架构

## 6.1 推荐技术栈

| 层级 | 技术选型 | 职责 |
| --- | --- | --- |
| 桌面应用壳 | Tauri 2 | 跨平台应用、窗口、打包与系统能力 |
| 前端 | React + TypeScript + Vite | 页面与交互组件 |
| 样式 | Tailwind CSS + shadcn/ui | 深色控制舱视觉体系 |
| 动效 | Framer Motion | 切页、告警与状态反馈 |
| 前端状态 | Zustand | 页面、设备、设置状态 |
| 请求缓存 | TanStack Query | API 调用与状态轮询 |
| AI / 业务后端 | Python FastAPI Sidecar | 生成、监控、留言、数据、设备客户端 |
| 数据模型 | SQLite + SQLModel | 本地数据存储 |
| 结构校验 | Pydantic | AI 结构化返回校验 |
| 渲染 | Pillow + QRCode | 墨水屏图片生成 |
| 调度 | APScheduler | 监控、定时任务与页面生成 |
| 数据接入 | GitHub REST API + HTTP 检测 | 提交和服务状态 |
| 设备端 | Arduino ESP8266 | 图片接收、健康状态、显示刷新 |

## 6.2 系统架构图

```text
┌────────────────────────────────────────────────────────────┐
│ Desktop App: Tauri + React                                  │
│ Bridge / Quest / Launch / Terminal / Watcher / Signals      │
└──────────────────────┬─────────────────────────────────────┘
                       │ Local REST / Event Stream
┌──────────────────────▼─────────────────────────────────────┐
│ Python Ink Engine: FastAPI Sidecar                          │
│ AI Director | Template Renderer | Monitoring | QR Messages │
│ GitHub Connector | SQLite | Scheduler | Device Client       │
└──────────────────────┬─────────────────────────────────────┘
                       │ HTTP / Wi-Fi
┌──────────────────────▼─────────────────────────────────────┐
│ InkBridge Device: ESP8266 Driver Board                      │
│ Health Check | Frame Receive | Display Refresh              │
└──────────────────────┬─────────────────────────────────────┘
                       │ SPI
┌──────────────────────▼─────────────────────────────────────┐
│ 4.2-inch E-Paper Display / 400 × 300 page                   │
└────────────────────────────────────────────────────────────┘
```

## 6.3 AI Provider 抽象

首版要求：支持配置兼容 OpenAI 协议的大模型服务，模型、Base URL 和 API Key 由用户在本机配置。

```python
from typing import Protocol, Type
from pydantic import BaseModel

class LLMProvider(Protocol):
    async def generate_structured(
        self,
        prompt: str,
        output_schema: Type[BaseModel]
    ) -> BaseModel:
        ...
```

规则：

- AI 输出必须经过 Pydantic Schema 校验；
- 生成失败时支持手动编辑 Payload 并继续渲染；
- API Key 禁止提交至 GitHub；
- 模型 Provider 可替换，不与业务逻辑强耦合。

---

## 7. 设备链路计划

## 7.1 阶段 A：复用已验证官方流程

首个可视化里程碑不先重写 ESP8266 固件，而是：

1. 上位机或 Python 服务生成 400 × 300 黑白图片；
2. 显示最终页面预览；
3. 通过已跑通的微雪官方上传更新流程将页面发送至墨水屏；
4. 记录真实显示效果，调整字体、字号、二维码与抖动参数。

### 验收标准

- 六种页面模板均生成可读图片；
- `QUEST_SCROLL` 首先实际显示成功；
- 中英文混排和二维码可完成肉眼/扫码验证。

## 7.2 阶段 B：自定义 InkBridge 固件

升级目标：让上位机可以发现设备、直接推送页面并获取在线状态。

| Endpoint | Method | 作用 |
| --- | --- | --- |
| `/api/device/status` | GET | 获取设备、屏幕和最后刷新状态 |
| `/api/device/health` | GET | Watcher 心跳检测 |
| `/api/device/config` | POST | 设置设备名、Wi-Fi 与主机地址 |
| `/api/display/frame` | POST | 上传经过处理的显示数据 |
| `/api/display/refresh` | POST | 执行刷新命令 |

### 首次设备绑定体验

1. ESP8266 启动临时热点 `INKOPS-NODE-01`；
2. 上位机发现设备并进入配网向导；
3. 用户填写局域网 Wi-Fi；
4. 设备加入网络，上位机发现设备心跳；
5. 自动推送绑定成功页面；
6. 屏幕显示 `DEVICE LINKED / FIRST MISSION READY`。

---

## 8. 本地数据模型

| 数据表 | 核心字段 | 用途 |
| --- | --- | --- |
| `devices` | id, name, ip, model, last_seen, status | 设备管理 |
| `projects` | id, name, goal, deadline, progress, status | 产品发射台 |
| `tasks` | id, date, raw_text, quest_payload, completion | 任务生成与结算 |
| `pages` | id, type, template, payload, image_path, priority, created_at | 页面候选与历史 |
| `display_logs` | id, page_id, device_id, pushed_at, result | 刷新记录 |
| `monitors` | id, name, endpoint, interval, status | 服务检测配置 |
| `incidents` | id, monitor_id, level, summary, opened_at, recovered_at | 告警历史 |
| `messages` | id, sender, text, safety_status, page_id, created_at | 留言与明信片 |
| `settings` | key, value | Provider、模板、刷新规则配置 |

### 数据与安全规则

- `.env`、Token、API Key、用户私人数据不得提交；
- 留言原文默认本地保存，不公开入库；
- 对外演示仅使用虚拟数据或已获同意的内容；
- 日志提供清除能力；
- 交易相关数据只用作风险纪律提醒。

---

## 9. 本地 API 草案

| Endpoint | Method | 功能 |
| --- | --- | --- |
| `/api/pages/current` | GET | 获取当前显示页与待推送页 |
| `/api/pages/history` | GET | 获取历史页面 |
| `/api/pages/{id}/push` | POST | 推送页面至指定设备 |
| `/api/quest/generate` | POST | 生成 AI 任务卷轴 |
| `/api/quest/{id}/settle` | POST | 提交任务完成结果 |
| `/api/launch/projects` | POST | 新建产品推进计划 |
| `/api/launch/{id}/briefing` | POST | 生成阻塞项与今日指令 |
| `/api/terminal/summary` | GET | 获取终端状态页数据 |
| `/api/monitors` | POST | 新增检测对象 |
| `/api/incidents/active` | GET | 获取活动告警 |
| `/api/signals/qr` | GET | 返回留言二维码 |
| `/api/signals/message` | POST | 提交访客留言 |
| `/api/director/recommendation` | GET | 返回推荐显示页面和原因 |
| `/api/devices` | GET | 获取墨水屏设备状态 |

---

## 10. 正式代码目录规划

```text
InkOps-Terminal/
├── README.md
├── docs/
│   ├── DEVELOPMENT_PLAN.md
│   ├── PRD.md
│   ├── UI_SPEC.md
│   ├── DEVICE_PROTOCOL.md
│   └── DEMO_SCRIPT.md
├── apps/
│   └── desktop/                    # Tauri 2 + React 上位机
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── features/
│       │   ├── stores/
│       │   └── lib/
│       └── src-tauri/
├── services/
│   └── ink-engine/                 # Python FastAPI Sidecar
│       ├── app/
│       │   ├── api/
│       │   ├── agents/
│       │   ├── render/
│       │   ├── monitors/
│       │   ├── models/
│       │   └── providers/
│       └── tests/
├── firmware/
│   └── esp8266-inkbridge/          # 第二阶段自定义固件
├── assets/
│   ├── templates/
│   ├── icons/
│   └── screenshots/
└── scripts/
    ├── setup.ps1
    └── demo_seed.py
```

---

## 11. 六周开发迭代计划

> 每周目标都必须形成真实输出物，避免长期停留在继续规划阶段。

## Phase 0：基础确认与页面草图｜第 1 周

| 工作项 | 输出物 | 验收标准 |
| --- | --- | --- |
| 确认屏幕型号、颜色和现有刷新方式 | `docs/DEVICE_BASELINE.md` | 写清硬件、屏幕尺寸、连接与刷新步骤 |
| 保存官方流程成功显示证据 | 实物照片/演示短片 | 后续 README 可引用 |
| 设计六种页面线框 | 图片或设计稿 | 每种 MVP 模板有 400 × 300 排版草图 |
| 确定大模型 Provider | `.env.example` 方案 | Python 可返回结构化 JSON |
| 冻结 MVP 字段与流程 | 本开发计划 | 新想法只入 Backlog |

## Phase 1：Python 页面引擎 + AI 任务卷轴｜第 2 周

| 工作项 | 输出物 | 验收标准 |
| --- | --- | --- |
| 初始化 FastAPI 服务 | `services/ink-engine` | 本地 API 可运行，Swagger 可打开 |
| 建立 SQLite 数据表 | 数据初始化脚本 | 能保存页面、任务与刷新记录 |
| 设计页面 Payload Schema | Pydantic Models | AI 数据可验证、失败可回退 |
| 开发渲染器基础组件 | Renderer | 能输出 400 × 300 PNG |
| 完成 `QUEST_SCROLL` 页面 | Quest API + 图像 | 输入任务后输出任务卷轴 |
| 第一次真实上屏 | 实拍图/录屏 | RPG 任务卡清晰显示到墨水屏 |

## Phase 2：桌面上位机骨架｜第 3 周

| 工作项 | 输出物 | 验收标准 |
| --- | --- | --- |
| 初始化 Tauri + React 工程 | `apps/desktop` | Windows 可启动上位机 |
| 建立主题与组件库 | 控制舱 UI 基础 | 统一黑白深色视觉体系 |
| 开发 Bridge 首页 | 实时预览与状态区 | 能显示页面预览及发送按钮 |
| 开发 Quest 页面 | 表单 + 生成交互 | 能调用 FastAPI 生成任务页 |
| 开发 Studio 页面 | 历史页与重发 | 可查看/导出/重新发送页面 |
| 开发 Device 设置页 | 设备 IP 与发送设置 | 能保存配置和执行刷新测试 |

## Phase 3：Launch、Terminal 与 Watcher｜第 4 周

| 工作项 | 输出物 | 验收标准 |
| --- | --- | --- |
| 完成 `LAUNCH_PANEL` 模板与模块 | 产品发射台页面 | AI 输出当前阻塞项 |
| 接入 GitHub 活动数据 | Terminal 服务 | 可读取指定仓库近期提交 |
| 完成 `TERMINAL_STATUS` 模板 | 终端状态页面 | 实屏可展示开发状态 |
| 开发监控调度 | Watcher 服务 | 周期检测 URL 与设备 |
| 完成 `SYSTEM_ALERT` 模板 | 告警页面 | 停止服务可触发警报 |
| 完成恢复事件页面 | Recovery 页面 | 服务恢复后可记录/展示 |

## Phase 4：Signals 与 Director Lite｜第 5 周

| 工作项 | 输出物 | 验收标准 |
| --- | --- | --- |
| 完成移动端留言页 | 响应式 H5 表单 | 手机扫码可正常留言 |
| 生成二维码 | QR 入口 | 实屏二维码可被手机扫描 |
| 完成过滤与明信片生成 | `POSTCARD` 页面 | 安全消息可上屏展示 |
| 建立统一事件队列 | Event Service | 各模块事件可在 Bridge 显示 |
| 实现 Director Lite | 推荐与覆盖规则 | P0 可覆盖，其他页可推荐发送 |
| 走通演示主流程 | 演示录屏初稿 | 任务→状态→告警→留言闭环可运行 |

## Phase 5：发布包装｜第 6 周

| 工作项 | 输出物 | 验收标准 |
| --- | --- | --- |
| 修复关键阻塞问题 | Release Candidate | 演示流程无致命报错 |
| 补全文档和截图 | README / docs | 项目定位与运行方式清晰 |
| 完成 `RELEASE_NEWS` 页面 | 发布头版 | 发布时可上屏展示 |
| 录制正式视频 | 60–120 秒视频 | 覆盖六个演示场景 |
| 发布 `V0.1.0` | GitHub Release | 对外可展示与访问 |
| 收集体验反馈 | Feedback List | 至少 3 人体验留言或观看演示 |

---

## 12. Epic 开发清单

## Epic A：上位机 UI

- [ ] 初始化 Tauri 2 + React + TypeScript + Vite 工程
- [ ] 配置 Tailwind CSS 与全局主题
- [ ] 建立主布局、导航、状态栏与事件流组件
- [ ] 实现 400 × 300 墨水屏预览组件
- [ ] 实现 Bridge 首页
- [ ] 实现 Quest 页面
- [ ] 实现 Launch 页面
- [ ] 实现 Terminal 页面
- [ ] 实现 Watcher 页面
- [ ] 实现 Signals 页面
- [ ] 实现 Studio 页面
- [ ] 实现 Device / Settings 页面

## Epic B：Python Ink Engine

- [ ] 初始化 FastAPI 服务与配置系统
- [ ] 建立日志、错误返回和健康检查接口
- [ ] 建立 SQLite / SQLModel 数据模型
- [ ] 实现 LLM Provider 抽象与结构化输出
- [ ] 实现页面历史与显示日志 API
- [ ] 实现事件队列与 Director Lite
- [ ] 实现 GitHub Connector 与 HTTP Monitor
- [ ] 实现二维码留言 API

## Epic C：页面模板与渲染

- [ ] 确立字体、字号与图标规范
- [ ] 完成 `QUEST_SCROLL`
- [ ] 完成 `TERMINAL_STATUS`
- [ ] 完成 `LAUNCH_PANEL`
- [ ] 完成 `SYSTEM_ALERT`
- [ ] 完成 `POSTCARD`
- [ ] 完成 `RELEASE_NEWS`
- [ ] 完成二值化、抖动与二维码实机测试
- [ ] 建立模板预览图库

## Epic D：设备链路

- [ ] 记录当前微雪官方流程与输入格式
- [ ] 实现图片导出与当前方式实屏刷新
- [ ] 设计 InkBridge 设备通信协议
- [ ] 开发 ESP8266 健康检查接口
- [ ] 开发页面接收与刷新接口
- [ ] 开发配网和设备绑定流程

## Epic E：产品展示

- [ ] 设计启动页面与 Logo
- [ ] 准备六张模板实拍效果图
- [ ] 撰写演示脚本
- [ ] 录制上位机与墨水屏联动视频
- [ ] 完善 GitHub 项目主页
- [ ] 制作个人网站项目展示页

---

## 13. 演示脚本

| 场景 | 用户操作 | 屏幕呈现 | 证明能力 |
| ---: | --- | --- | --- |
| 1 | 输入今天要完成的三件事 | RPG 每日任务卷轴 | AI 生成 + 图片渲染 + 上屏 |
| 2 | 同步当前仓库提交数据 | 黑客风作战终端 | GitHub 数据整合 |
| 3 | 更新当前产品进度 | 产品上线发射台 | AI 判断阻塞任务 |
| 4 | 关闭被监控的网站或 API | System Alert 页面覆盖 | 监控 + 事件优先级 |
| 5 | 恢复服务，朋友扫码留言 | 恢复卡 / Postcard | 状态闭环 + 互动入口 |
| 6 | 生成当日成果总结 | Maker Daily 发布战报 | 产品叙事与展示完成度 |

演示视频标题建议：

- 《我把墨水屏做成了 AI 独立开发者作战终端》
- 《服务器挂了以后，我桌上的电子纸自动变成警报牌》
- 《我做了一块会判断此刻最重要事情的墨水屏》

---

## 14. 测试与验收

## 14.1 功能验收表

| 测试项 | 验收标准 |
| --- | --- |
| AI 任务生成 | 普通任务输入可获得字段合法的卷轴 Payload |
| 图片渲染 | 六种模板输出均为可显示的 400 × 300 页面 |
| 实屏清晰度 | 关键信息可读，二维码在实际屏幕可扫描 |
| 设备推送 | 局域网内刷新稳定，错误可追踪 |
| GitHub 状态页 | 可展示真实仓库的近期开发摘要 |
| 告警流程 | URL 连续失败后生成告警页面，恢复后记录事件 |
| 留言流程 | 手机提交留言可审核并生成明信片页面 |
| 页面历史 | 可回看并重新发送已生成页面 |
| 配置安全 | 仓库扫描不到密钥与私人日志 |

## 14.2 视觉验收表

| 项目 | 验收标准 |
| --- | --- |
| 一致性 | PC 控制舱与墨水页面具有一致风格语言 |
| 可读性 | 屏幕主要标题和状态在桌面正常距离清晰可见 |
| 信息密度 | 每页无过长段落，不超过 5 个信息块 |
| 仪式感 | 任务、警报、发布和留言页面具有明显场景差异 |

---

## 15. 风险管理

| 风险 | 影响 | 处理策略 |
| --- | --- | --- |
| 官方刷新流程难以被程序自动化 | 设备自动推送延迟 | 首版先保留现有可用流程，固件升级放第二阶段 |
| ESP8266 图像传输/内存受限 | 自定义固件不稳定 | 只发送处理后的二值数据，接口保持轻量 |
| 中文字体或二维码实屏效果不佳 | 影响展示 | 全部在 Python 端渲染，尽早完成实屏反复测试 |
| AI 输出不可控 | 页面溢出或内容失焦 | Schema 校验、字数上限、模板固定、允许人工编辑 |
| 墨水屏刷新慢 | 体验被频繁刷新拖累 | 使用事件优先级与最低刷新间隔 |
| 项目功能膨胀 | MVP 长期不发布 | 以本开发计划为冻结基线，新想法只进 Backlog |
| 留言出现不当内容 | 上屏风险 | 默认人工确认 + AI 过滤 + 长度限制 |
| 公共仓库泄露凭证 | 安全事故 | `.env` 忽略、提交前检查、只保留示例配置 |

---

## 16. 版本路线图

| 版本 | 阶段目标 | 交付内容 |
| --- | --- | --- |
| `V0.1 Prototype` | 页面与实屏验证 | AI 任务卡、PNG 渲染、手动刷新 |
| `V0.2 Desktop MVP` | 桌面端可用 | Bridge、Quest、Launch、Studio、Device |
| `V0.3 Connected MVP` | 外部数据联动 | GitHub、Watcher、Signals、历史记录 |
| `V0.4 Director Lite` | 核心创新落地 | 页面优先级、推荐展示、告警覆盖 |
| `V1.0 Demo Release` | 对外展示发布 | 完整演示视频、截图、文档与稳定流程 |
| `V1.1 Maker Report` | 强化趣味与传播 | Token 战报、发布报纸、自动规则 |
| `V2.0 Indie Business` | 连接变现运营 | 收入、访客、咨询与接单页 |
| `V3.0 Companion Ecosystem` | 连接更多硬件/生活 | ElectronPet、学习、交易纪律、生活玩法 |

---

## 17. 立即行动清单

### 第一个里程碑：任务卷轴真正上屏

- [ ] 确认屏幕型号：黑白或三色、分辨率与刷新限制
- [ ] 将官方更新流程写成 `docs/DEVICE_BASELINE.md`
- [ ] 采集一张当前成功刷新的实物照片
- [ ] 初始化 `services/ink-engine` Python 工程
- [ ] 使用 Pillow 生成第一张 `QUEST_SCROLL` 静态图
- [ ] 配置一个可用的大模型 Provider，生成结构化任务数据
- [ ] 将 AI 任务图片通过当前已验证流程显示在实体屏幕上
- [ ] 截图与实拍上传仓库，形成项目第一条真实成果记录

### 第一个可公开展示的里程碑文案

> 输入一句“今天我要完成什么”，AI 自动生成一张 RPG 任务卷轴，并成功显示到桌面实体墨水屏上。

---

## 18. 项目宣言

**InkOps Terminal 不是一块被动更新图片的显示屏。**

它是独立开发者的现实桌面指挥终端：任务被铸成副本，开发被记录为战绩，故障被提炼成警报，访客消息被转换为纸面信号，真正发布的成果被印成头版。

AI 负责从复杂信息里挑出值得关注的一页；电子墨水屏负责让这一页在现实空间里长期存在。

> **Build. Ship. Display. Repeat.**
