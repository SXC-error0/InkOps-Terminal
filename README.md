# InkOps Terminal

> **AI-Powered E-Ink Mission Control for Indie Makers**  
> 一台由 AI 驱动、通过电子墨水屏展示关键信息的独立开发者桌面作战终端。

<p align="center">
  <strong>任务变成副本 · 提交变成战绩 · 异常变成警报 · 留言变成纸面信号 · 发布变成头版</strong>
</p>

---

## Project Vision｜项目愿景

InkOps Terminal 不是普通的电子纸图片上传工具，也不是一个仅供查看数据的桌面仪表盘。

它连接你的任务、开发进度、GitHub 提交、服务状态与访客留言，通过 AI 对信息进行压缩、判断与编排，并把**当前最值得出现的一页**推送到现实桌面上的 4.2 英寸电子墨水屏。

电子纸刷新不频繁，却能让重要信息安静地存在很久。这正是项目的核心设计理念：

> **One display. One page. The most important thing right now.**

---

## Hardware Baseline｜硬件基础

- 4.2 英寸电子墨水屏
- Waveshare E-Paper ESP8266 Driver Board
- 已验证：通过微雪官方示例完成屏幕点亮与内容更新
- 目标显示页面：`400 × 300` 黑白高对比页面

首阶段将复用已跑通的刷新链路，重点完成 AI 内容生成、页面渲染和上位机体验；后续再开发自定义 ESP8266 `InkBridge` 固件，实现自动推送、设备心跳和配网绑定。

---

## Core Innovation｜核心创新：AI Display Director

墨水屏同一时间只能显示一页，但任务、系统告警、项目里程碑、访客留言和战报都可能同时产生。

**AI Display Director** 将所有模块生成的内容视为候选页面，根据事件优先级、紧急程度、时间和展示策略，选择当下最应该出现在实体屏幕上的一页。

| 优先级 | 事件类型 | 示例 | 刷新策略 |
| ---: | --- | --- | --- |
| P0 | 紧急异常 | 网站/API/设备离线 | 立即覆盖当前页面 |
| P1 | 关键成果 | 产品发布、新咨询、首个里程碑 | 立即展示并归档 |
| P2 | 日常核心页面 | 早晨任务卷轴、夜间结算 | 定时展示 |
| P3 | 社交互动 | 新留言、挑战结果 | 空闲时展示 |
| P4 | 轻内容 | 知识卡、宠物状态 | 不打断高优先级页面 |
| P5 | 待机内容 | 黑客风终端状态页 | 无事件时常驻 |

---

## MVP Modules｜第一版功能

| 模块 | 墨水屏展示内容 | 核心能力 |
| --- | --- | --- |
| **Command Bridge** | 当前页面预览与推荐刷新状态 | 上位机总指挥舱、设备推送、事件流 |
| **AI Daily Quest** | RPG 主线、支线、Boss、奖励、禁令 | 将普通待办转换为任务卷轴 |
| **Launch Control** | 产品进度、阻塞项、倒计时、今日指令 | 推动 MVP 真正上线 |
| **Terminal Status** | 项目、GitHub Commit、服务状态、宣言 | 展示开发者身份与战绩 |
| **System Watcher** | 网站/API/设备在线状态与告警 | 服务异常时生成警报页面 |
| **Signal Box** | 纸感明信片或秘密电报 | 访客扫码留言并生成展示卡 |

### Future Modules｜后续扩展

- Token 燃烧告示牌 / 发布战报报纸
- 独立开发者收入战报 / 网站访客作战牌
- AI Bug 悬赏令 / GitHub 连击战绩牌
- ElectronPet 宠物情绪页
- 每日知识抽卡机 / 交易纪律警示牌
- 城市探索盲盒票 / 健身升级属性牌

---

## Product Experience｜典型演示流程

1. 开发者在上位机输入今天的任务。
2. AI 将任务生成 RPG 风格任务卷轴，并推送到实体墨水屏。
3. GitHub 提交后，终端页展示今日开发战绩。
4. 被监控服务异常时，墨水屏自动切换为 `SYSTEM ALERT`。
5. 服务恢复或收到扫码留言后，屏幕展示恢复战报或纸感信号卡。
6. 夜间由 AI 汇总当天事件，生成一页开发战报头版。

---

## Recommended Architecture｜技术架构

```text
┌──────────────────────────────────────────────────────────┐
│ Desktop App: Tauri 2 + React + TypeScript                 │
│ Bridge / Quest / Launch / Terminal / Watcher / Signals    │
└─────────────────────┬────────────────────────────────────┘
                      │ Local REST / Events
┌─────────────────────▼────────────────────────────────────┐
│ Python Ink Engine: FastAPI Sidecar                        │
│ AI Director | Renderer | Monitor | SQLite | Device Client │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTP / Wi-Fi
┌─────────────────────▼────────────────────────────────────┐
│ InkBridge: ESP8266 E-Paper Driver Board                   │
│ Receive Frame | Refresh Display | Report Health           │
└─────────────────────┬────────────────────────────────────┘
                      │ SPI
┌─────────────────────▼────────────────────────────────────┐
│ 4.2-inch E-Ink Display: The page worth seeing now         │
└──────────────────────────────────────────────────────────┘
```

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Desktop shell | Tauri 2 | Cross-platform upper-computer app |
| Frontend | React + TypeScript + Tailwind CSS | Command-console UI and e-ink preview |
| AI/backend | Python FastAPI Sidecar | AI orchestration, APIs, monitors, data access |
| Local data | SQLite + SQLModel | Tasks, pages, messages, incidents and logs |
| Rendering | Pillow + QRCode | Render validated page payloads to e-ink PNG |
| Scheduling | APScheduler | Timed quests, monitoring and page generation |
| Integrations | GitHub REST API / HTTP health checks | Project activity and system status |
| Device | Arduino ESP8266 | Display refresh and device connectivity |

---

## E-Ink Page Templates｜墨水页面模板

| Template ID | Purpose |
| --- | --- |
| `QUEST_SCROLL` | 每日任务卷轴 |
| `TERMINAL_STATUS` | 黑客风个人作战终端 |
| `LAUNCH_PANEL` | 产品上线发射台 |
| `SYSTEM_ALERT` | 服务或设备异常警报 |
| `POSTCARD` | 异步电子明信片 |
| `RELEASE_NEWS` | 发布 / 开发战报头版 |

AI 只生成经过约束的结构化内容，实际布局由固定模板渲染，保证有限的电子纸画布始终清晰、稳定、可读。

---

## Roadmap｜开发路线

| Version | Goal | Major Outcomes |
| --- | --- | --- |
| `V0.1 Prototype` | 实屏效果验证 | AI 任务卡、图片渲染、手动上屏 |
| `V0.2 Desktop MVP` | 上位机可操作 | Bridge、Quest、Launch、Terminal、Device |
| `V0.3 Connected MVP` | 数据与互动联动 | Watcher、GitHub、Signals、页面历史 |
| `V0.4 Director Lite` | 展现核心创新 | 候选页、优先级推荐、告警覆盖 |
| `V1.0 Demo Release` | 可对外展示 | 稳定演示、截图、视频与说明文档 |
| `V2.0 Indie Business` | 连接运营与变现 | 收入战报、访客分析、客户雷达 |
| `V3.0 Companion Ecosystem` | 扩展硬件生态 | ElectronPet、学习与生活模块 |

---

## Documentation｜文档

- [Development Plan / 开发计划](docs/DEVELOPMENT_PLAN.md)

---

## Repository Status｜当前状态

`Planning / Architecture Design / Hardware Baseline Verified`

当前阶段目标：**输入一句今日任务，AI 生成一张 RPG 任务卷轴页面，并成功显示到实体墨水屏。**

---

## Security Notes｜安全约束

- API Key 不提交到仓库，统一使用本地环境变量或安全配置存储。
- 访客留言在上屏前进行过滤，默认支持人工确认。
- 交易相关页面仅用于风险纪律提示，不构成投资建议或自动交易承诺。

---

## License

License will be determined before the first open-source release.

---

<p align="center"><strong>Build. Ship. Display. Repeat.</strong></p>
