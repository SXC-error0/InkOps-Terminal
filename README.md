# InkOps Terminal

> **AI-Powered E-Ink Mission Control for Indie Makers**
> 一台由 AI 驱动、通过电子墨水屏展示关键信息的独立开发者桌面终端。

<p align="center">
  <strong>任务变成副本 · 提交变成战绩 · 异常变成警报 · 留言变成纸面信号 · 发布变成头版</strong>
</p>

---

## 核心创新: AI Display Director

墨水屏同一时间只能显示一页。AI Display Director 将所有模块的候选页面按优先级排序，选择当前最值得出现在实体屏幕上的一页。

| 优先级 | 事件 | 行为 |
|--------|------|------|
| P0 | 网站/API/设备离线 | 立即覆盖 |
| P1 | 关键成果 | 立即展示 |
| P2 | 日常核心 | 定时展示 |
| P3 | 社交互动 | 空闲展示 |
| P5 | 待机页面 | 常驻 |

---

## 功能模块

| 频道 | 功能 | 快捷键 |
|------|------|--------|
| Bridge | 总指挥舱: 屏幕预览 + AI 推荐 + 事件流 | `Ctrl+1` |
| Quest | 输入待办 → AI 生成 RPG 任务卷轴 | `Ctrl+2` |
| Launch | 产品进度 + 阻塞项 + AI 今日指令 | `Ctrl+3` |
| Terminal | GitHub 提交 + 服务状态 + MVP 进度 | `Ctrl+4` |
| Watcher | HTTP 健康检测 + 自动告警页面 | `Ctrl+5` |
| Signals | 留言二维码 + 明信片生成 + 安全过滤 | `Ctrl+6` |
| Studio | 页面历史 + 重渲染 + 导出 | `Ctrl+7` |
| Device | 墨水屏设备扫描 + 绑定 | `Ctrl+8` |

---

## 快速开始

### 前置条件

- Python 3.10+ 和 Node.js 24+
- DeepSeek API Key (或其他兼容 OpenAI 协议的 LLM)
- [可选] 4.2 寸墨水屏 + ESP8266 驱动板

### 1. 配置

```bash
cd services/ink-engine
cp .env.example .env
# 编辑 .env 填入 LLM_API_KEY
```

### 2. 启动后端

```bash
cd services/ink-engine
pip install -r requirements.txt  # 或 uv sync
python3 -m uvicorn app.main:app --port 8700
```

### 3. 启动前端

```bash
cd apps/desktop
pnpm install
npx vite --port 5173
```

浏览器打开 `http://localhost:5173`

### 4. [可选] 生成演示数据

```bash
cd services/ink-engine
python3 ../../scripts/demo_seed.py
```

一键生成 6 种模板的演示页面到数据库。

---

## 技术架构

```
┌─ 前端 (React + TypeScript + Vite) ──────────┐
│  8 频道 SPA, Tailwind CSS, Zustand           │
│  fetch() → localhost:8700/api/*              │
└────────────────────┬─────────────────────────┘
                     │ HTTP REST
┌────────────────────▼─────────────────────────┐
│  Python Ink Engine (FastAPI)                 │
│  AI Agent × 2 | 模板渲染 × 6 | SQLite 9表    │
│  APScheduler 监控调度 | Director 优先级推荐   │
└────────────────────┬─────────────────────────┘
                     │ HTTP / Wi-Fi
┌────────────────────▼─────────────────────────┐
│  ESP8266 InkBridge (WIP)                     │
│  4.2" E-Paper Display / 400 × 300 px        │
└──────────────────────────────────────────────┘
```

| 层级 | 技术栈 |
|------|--------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS + Zustand + TanStack Query |
| AI/后端 | Python FastAPI + SQLite/SQLModel + Pydantic + Pillow |
| LLM | DeepSeek Chat (兼容 OpenAI 协议, 可替换) |
| 渲染 | Pillow + qrcode → Floyd-Steinberg 抖动 → 400×300 黑白 PNG |
| 调度 | APScheduler (60s 周期监控 + Director 自动推送) |
| 设备 | ESP8266 Arduino (WIP) |

---

## 6 个页面模板

| 模板 | 触发 | 示例内容 |
|------|------|----------|
| `QUEST_SCROLL` | 用户输入待办 | RPG 任务卡: 主线/Boss/弱点/禁令/奖励 |
| `TERMINAL_STATUS` | 定时生成 | 项目/提交/服务状态/宣言 |
| `LAUNCH_PANEL` | 项目分析 | 产品进度/阻塞项/倒计时/指令 |
| `SYSTEM_ALERT` | 监控失败 | 故障对象/诊断/行动/检测时间 |
| `POSTCARD` | 留言提交 | 短消息/署名/纸感卡片 |
| `RELEASE_NEWS` | 战报总结 | 头条/成果摘要/下一步 |

---

## 项目结构

```
InkOps-Terminal/
├── README.md
├── docs/
│   ├── DEVELOPMENT_PLAN.md   # 完整开发计划 (25 章)
│   ├── PRD.md                # 产品需求文档
│   ├── UI_SPEC.md            # UI 规格说明书
│   └── DEMO_SCRIPT.md        # 演示脚本
├── services/ink-engine/      # Python AI 引擎 & API
├── apps/desktop/             # React 上位机
├── firmware/                 # ESP8266 固件 (WIP)
├── scripts/
│   └── demo_seed.py          # 演示数据生成器
└── .gitignore
```

---

## 文档

- [开发计划](docs/DEVELOPMENT_PLAN.md) — 技术架构、数据模型、API 设计、测试验收
- [产品需求](docs/PRD.md) — 用户场景、MVP 范围、成功标准
- [UI 规格](docs/UI_SPEC.md) — 设计 Token、8 频道布局、6 模板排版
- [演示脚本](docs/DEMO_SCRIPT.md) — 6 场景录制指南

---

## 路线图

| 版本 | 目标 |
|------|------|
| `V0.1 Prototype` | 实屏效果验证 (✅ 已完成) |
| `V0.2 Desktop MVP` | 桌面端可操作 (✅ 已完成) |
| `V0.3 Connected MVP` | 数据与互动联动 (✅ 已完成) |
| `V0.4 Director Lite` | 核心创新落地 (✅ 已完成) |
| `V1.0 Demo Release` | 对外展示发布 (🔄 进行中) |
| `V2.0 Indie Business` | 连接运营与变现 |
| `V3.0 Companion Ecosystem` | 扩展硬件生态 |

---

## 安全约束

- API Key 不进仓库 (`.env` → `.gitignore`)
- 用户输入经 Pydantic Schema 校验
- 留言提交经安全过滤 (敏感词 + 长度限制)
- 敏感信息不出现在截屏和演示视频中

---

<p align="center"><strong>Build. Ship. Display. Repeat.</strong></p>
