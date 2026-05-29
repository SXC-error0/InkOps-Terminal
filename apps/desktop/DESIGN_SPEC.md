# InkOps Terminal Design Specification

版本 2.0 | 2026-05-28

---

## 目录

1. [设计理念](#1-设计理念)
2. [色彩系统](#2-色彩系统)
3. [字体系统](#3-字体系统)
4. [间距与网格](#4-间距与网格)
5. [布局架构](#5-布局架构)
6. [组件模式](#6-组件模式)
7. [侧边栏设计](#7-侧边栏设计)
8. [状态栏设计](#8-状态栏设计)
9. [E-Ink 预览组件](#9-e-ink-预览组件)
10. [8 个页面布局模板](#10-各页面布局模板)
11. [动画与过渡](#11-动画与过渡)
12. [Tailwind v4 主题配置](#12-tailwind-v4-主题配置)
13. [实施指南](#13-实施指南)

---

## 1. 设计理念

### 核心命题

InkOps Terminal 是一个**硬件设备控制台**——它管理一台 4.2 英寸电子墨水屏设备。设计应该传达精确、可控、专业的硬件工具感。

### 设计原则

- **精度优先**：每一个像素、每一条分割线都有意义，不添加纯装饰性元素
- **内容层次**：E-Ink 预览是视觉中心，其余元素分层支持
- **一致性**：8 个页面共享同一套视觉语言，差异仅在于内容布局
- **暗色为主，亮色为辅**：深色侧边栏 + 浅色内容区的双色体系，减少视觉疲劳
- **subtle 而非 loud**：用微妙的颜色差异和间距表达层级，而非厚重的阴影和边框

### 参考标杆

- **Linear**：导航侧边栏的极简处理、键盘快捷键的展示方式
- **Vercel**：卡片构图的层次感、状态指示器的精致设计
- **Stripe**：表单和输入组件的交互反馈、颜色语义的一致性
- **Arc Browser**：侧边栏的圆角/间距处理、hover 状态的细腻过渡

### 风格方向

**精密工业仪表盘** —— 融合硬件工具控制台与现代化 Web 应用设计语言。想象一个用于管理精密仪器的桌面应用：干净、可控、无干扰。

---

## 2. 色彩系统

### 2.1 色板总览

色彩系统建立在 Tailwind v4 的 `--color-*` 命名空间下，所有颜色可通过 `bg-ink-*`、`text-ink-*` 等 Tailwind 工具类直接使用。

#### 主色板：Ink（冷灰）

ink 是中性色板，覆盖 95% 的界面。基调是冷灰而非暖灰，更接近硬件的工业感。

| Token | Hex | 用途 |
|-------|-----|------|
| `ink-25` | `#fbfbfb` | 页面背景 (最浅) |
| `ink-50` | `#f6f6f7` | 次要表面背景 |
| `ink-100` | `#eeeff0` | 卡片悬停、分割线 |
| `ink-150` | `#e4e5e7` | 输入框边框、禁用态 |
| `ink-200` | `#d1d3d6` | 默认边框 |
| `ink-300` | `#a3a7ad` | 占位符文字 |
| `ink-400` | `#727780` | 次级文字 |
| `ink-500` | `#535860` | 正文颜色变体 |
| `ink-600` | `#3e4149` | 主正文颜色 |
| `ink-700` | `#272930` | 标题文字 |
| `ink-800` | `#16171c` | 最深正文 |
| `ink-900` | `#0b0c0e` | 侧边栏背景 |
| `ink-925` | `#060708` | 侧边栏最深区域 |

#### 侧边栏色板：Sidebar

侧边栏使用独立的暗色调，不直接复用 ink 色板以保证在极暗背景下的可读性微调。

| Token | Hex | 用途 |
|-------|-----|------|
| `sidebar-bg` | `#0b0c0e` | 侧边栏背景 |
| `sidebar-hover` | `#18191d` | 侧边栏条目悬停 |
| `sidebar-active` | `#222327` | 侧边栏条目激活 |
| `sidebar-border` | `#1a1b1f` | 侧边栏分割线 |
| `sidebar-text` | `#6b6f78` | 未激活文字 |
| `sidebar-text-active` | `#eeeff0` | 激活/高亮文字 |

#### 语义色板

| Token | Hex | 用途 |
|-------|-----|------|
| `accent` | `#0ea5e9` | 主交互色 (sky-500) |
| `accent-light` | `#e0f2fe` | 主色浅底 (用于 badge、hover) |
| `accent-strong` | `#0284c7` | 主色深色 (hover、active) |
| `success` | `#10b981` | 成功、在线 (emerald-500) |
| `success-light` | `#d1fae5` | 成功浅底 |
| `warning` | `#f59e0b` | 警告 (amber-500) |
| `warning-light` | `#fef3c7` | 警告浅底 |
| `danger` | `#ef4444` | 危险、离线、错误 (red-500) |
| `danger-light` | `#fee2e2` | 危险浅底 |
| `purple` | `#8b5cf6` | 紫色辅色 (violet-500) |
| `purple-light` | `#ede9fe` | 紫色浅底 |
| `pink` | `#ec4899` | 粉色辅色 (用于 E-Ink 相关强调) |
| `pink-light` | `#fce7f3` | 粉色浅底 |

#### E-Ink 预览专用

| Token | Hex | 用途 |
|-------|-----|------|
| `eink-case` | `#1e293b` | 墨水屏外壳/边框 (slate-800) |
| `eink-screen` | `#fafaf9` | 墨水屏屏幕底色 |
| `eink-text` | `#1c1917` | 墨水屏 SIM 内文字 |
| `eink-accent` | `#292524` | 墨水屏 SIM 内强调色 |

### 2.2 日/夜模式

当前版本仅设计浅色内容区 (light mode)。深色模式作为后续迭代需求。

但如果需要深色模式，核心变化：
- 内容区背景从 `ink-25` 变为 `ink-900`
- 卡片背景从 `white` 变为 `ink-800`
- 正文从 `ink-600` 变为 `ink-100`
- 侧边栏保持不变（始终暗色）

---

## 3. 字体系统

### 3.1 字体族

```
Font Sans:  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
Font Mono:  "JetBrains Mono", "Fira Code", "Cascadia Code", "SF Mono", monospace
```

Inter 作为 UI 文字，JetBrains Mono 用于数据、时间戳、代码块。

### 3.2 字号阶梯 (Tailwind 扩展)

| Token | Size | Line Height | 用途 |
|-------|------|-------------|------|
| `xs` | 11px | 16px | 标签、帮助文本、快捷键 |
| `sm` | 12.5px | 18px | 次级内容、列表项正文 |
| `base` | 13.5px | 20px | 正文（桌面应用最优阅读尺寸） |
| `lg` | 15px | 22px | 卡片标题、强调内容 |
| `xl` | 18px | 26px | 页面标题、大号数字 |
| `2xl` | 24px | 30px | Hero 数字、大号统计 |
| `3xl` | 32px | 38px | 页面主标题 (Dashboard Hero) |

### 3.3 字重使用规范

| Weight | 使用场景 |
|--------|---------|
| 400 (Regular) | 正文、标签 |
| 500 (Medium) | 次级标题、按钮文字、链接 |
| 600 (Semibold) | 卡片标题、导航激活项 |
| 700 (Bold) | 页面标题、重要数字 |

### 3.4 排版规则

1. **行高不缩**：`leading-none` 仅用于大号数字 (2xl+)
2. **字距不扩**：`tracking-tight` 用于标题，`tracking-normal` 用于正文
3. **单色标记**：`font-mono` + `tabular-nums` 用于所有数字和时间戳
4. **两端对齐**：表格类数据使用 `text-right tabular-nums` 右对齐

---

## 4. 间距与网格

### 4.1 间距阶梯

使用 Tailwind 默认间距 + 少量自定义：

| Token | Value | Tailwind Class |
|-------|-------|----------------|
| 4px  | 0.25rem | `gap-1` |
| 6px  | 0.375rem | `gap-1.5` |
| 8px  | 0.5rem | `gap-2` |
| 10px | 0.625rem | `gap-2.5` |
| 12px | 0.75rem | `gap-3` |
| 14px | 0.875rem | `gap-3.5` |
| 16px | 1rem | `gap-4` |
| 20px | 1.25rem | `gap-5` |
| 24px | 1.5rem | `gap-6` |
| 32px | 2rem | `gap-8` |
| 40px | 2.5rem | `gap-10` |

### 4.2 全局间距原则

1. **页面内边距**：`p-6` (24px) 作为页面内容的默认 padding
2. **卡片内边距**：`p-5` (20px) 作为 `.card` 的默认 padding
3. **卡片间距**：`gap-4` (16px) 或 `gap-5` (20px) 取决于卡片密度
4. **列表项间距**：`gap-0.5` 或 `gap-1` 用于紧凑列表
5. **表单字段间距**：`gap-4` 用于表单内垂直间距

### 4.3 圆角系统

| Token | Value | Tailwind Class | 用途 |
|-------|-------|----------------|------|
| none | 0px | `rounded-none` | 墨水屏屏幕 |
| xs | 4px | `rounded` | 按钮、输入框、badge |
| sm | 6px | `rounded-md` | 小卡片、列表项 |
| md | 8px | `rounded-lg` | 标准卡片 |
| lg | 12px | `rounded-xl` | 大型卡片、Hero 区域 |
| xl | 16px | `rounded-2xl` | E-Ink 设备外壳 |
| full | 9999px | `rounded-full` | 头像、状态指示灯 |

### 4.4 窗口约束

桌面窗口默认 1280x860，最小 1024x720。

- 侧边栏固定 220px
- 状态栏固定 44px
- 内容区可用宽度：约 1060px (1280 - 220)
- 内容区可用高度：约 816px (860 - 44)

---

## 5. 布局架构

### 5.1 全局布局

```
+--------+------------------------------------------+
|        |  StatusBar (h-11, border-b)               |
|        +------------------------------------------+
|        |                                          |
|Sidebar |  Main Content Area                       |
| w-55   |  (flex-1, overflow-auto)                 |
|(220px) |                                          |
|        |  Page-specific layout goes here          |
|        |                                          |
|        |                                          |
+--------+------------------------------------------+
```

### 5.2 页面布局类型

根据 8 个页面的内容特征，定义了 3 种布局模式：

**模式 A：焦点中心 (Focus-Center)**
- 适用：仪表盘 (Bridge)、数据看板 (Terminal)
- 特征：中心大区域 + 下方网格
- 最大宽度：无限制 (使用 flex-1 撑满)
- 内边距：`p-6`

**模式 B：双栏均衡 (Split-Equal)**
- 适用：AI 任务 (Quest)
- 特征：左右对半分
- 最大宽度：无限制
- 内边距：`p-6`
- 最小高度：撑满内容区

**模式 C：约束单列 (Constrained-Single)**
- 适用：项目进度 (Launch)、监控告警 (Watcher)、留言消息 (Signals)、历史归档 (Studio)、设备管理 (Device)
- 特征：居中单列或双列卡片
- 最大宽度：`max-w-2xl` (672px) 或 `max-w-3xl` (768px)
- 内边距：`p-6`
- 垂直居中：部分页面使用 `my-auto`

**模式 B2：不等宽双栏 (Asymmetric-Split)**
- 适用：留言消息 (Signals) 的留言板布局
- 特征：左侧工具栏 (小) + 右侧内容列表 (大)
- 最大宽度：`max-w-4xl` (896px)

---

## 6. 组件模式

### 6.1 卡片 (Card)

卡片是应用中最核心的容器组件。

**标准卡片：**
```html
<div class="bg-white border border-ink-200 rounded-lg shadow-xs">
  <!-- card content -->
</div>
```

**带标题的卡片：**
```html
<div class="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
  <div class="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none">
    <LucideIcon size={15} />
    标题文本
    <div class="ml-auto"><!-- actions --></div>
  </div>
  <div class="p-5">
    <!-- card body -->
  </div>
</div>
```

**卡片变体：**
- `.shadow-xs` — 默认卡片（1px 阴影，模拟 1% 透明度）
- `.shadow-sm` — 悬浮卡片（hover 时提升）
- 无阴影 — 扁平列表项（用 `bg-ink-50` 区分）

**卡片交互：**
- `hover:border-ink-300` — 可点击的卡片悬停时边框加深
- `transition-colors duration-150` — 所有颜色过渡统一 150ms
- 嵌套卡片不推荐超过 2 层

### 6.2 按钮 (Button)

**主按钮 (Primary)：**
```html
<button className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 text-sm
  font-medium rounded cursor-pointer select-none
  bg-accent text-white
  hover:bg-accent-strong
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
  disabled:opacity-35 disabled:cursor-not-allowed
  transition-colors duration-150">
  <Icon size={14} />
  按钮文字
</button>
```

**次级按钮 (Secondary)：**
```html
<button className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 text-sm
  font-medium rounded cursor-pointer select-none
  bg-white text-ink-500 border border-ink-200
  hover:bg-ink-50 hover:text-ink-600 hover:border-ink-300
  ...">
```

**幽灵按钮 (Ghost)：**
```html
<button className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3 text-sm
  font-medium rounded cursor-pointer select-none
  text-ink-400
  hover:bg-ink-50 hover:text-ink-600
  ...">
```

**尺寸变体：**
- `sm`: `h-7 px-2.5 text-xs` — 紧凑操作
- `md`: `h-[34px] px-3.5 text-sm` — 默认
- `lg`: `h-10 px-5 text-sm` — 主要 CTA
- `icon-only`: `size-8 p-0` — 图标按钮

### 6.3 输入框 (Input)

```html
<input className="w-full h-[34px] px-2.5 text-sm font-sans
  text-ink-600 bg-white
  border border-ink-200 rounded
  placeholder:text-ink-300
  focus:border-accent focus:ring-3 focus:ring-accent-light
  outline-none transition-all duration-150" />
```

**文本域 (Textarea)：**
```html
<textarea className="w-full p-3 text-sm font-sans leading-relaxed
  text-ink-600 bg-white
  border border-ink-200 rounded
  placeholder:text-ink-300 resize-none
  focus:border-accent focus:ring-3 focus:ring-accent-light
  outline-none transition-all duration-150" />
```

### 6.4 徽章 (Badge)

```html
<!-- 蓝色徽章 -->
<span class="inline-flex items-center gap-1 h-[22px] px-2 text-[11px] font-medium
  rounded whitespace-nowrap
  bg-accent-light text-accent-strong">
  <span class="size-1.5 rounded-full bg-current opacity-50" />
  标签文本
</span>
```

**颜色变体：**
- `bg-accent-light text-accent-strong` — 信息/默认
- `bg-success-light text-success` — 成功/在线
- `bg-warning-light text-warning` — 警告/待处理
- `bg-danger-light text-danger` — 危险/错误
- `bg-purple-light text-purple` — 紫色/特殊
- `bg-ink-100 text-ink-500` — 灰色/草稿

### 6.5 状态指示灯 (Status Dot)

```html
<!-- 在线 -->
<span class="inline-block size-2 rounded-full bg-success" />

<!-- 离线 -->
<span class="inline-block size-2 rounded-full bg-ink-300" />

<!-- 警告 -->
<span class="inline-block size-2 rounded-full bg-warning" />

<!-- 活跃中 (带脉冲动画) -->
<span class="relative flex size-2">
  <span class="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
  <span class="relative inline-flex size-2 rounded-full bg-success" />
</span>
```

### 6.6 统计卡片 (Stat Item)

每个统计项是一个 compact 水平排列的信息单元：

```html
<div class="flex items-center gap-3">
  <div class="size-8 rounded-lg flex items-center justify-center shrink-0 bg-ink-50">
    <Icon size={15} class="text-ink-500" />
  </div>
  <div class="min-w-0">
    <div class="text-[11px] text-ink-400 leading-tight">标签</div>
    <div class="text-lg font-semibold font-mono tabular-nums text-ink-700 leading-tight">42</div>
  </div>
</div>
```

### 6.7 进度条 (Progress Bar)

```html
<div class="w-full h-1 rounded-full bg-ink-100 overflow-hidden">
  <div class="h-full rounded-full bg-accent transition-all duration-600 ease-out"
       style="width: 68%" />
</div>
```

### 6.8 列表行 (List Row)

通用的可操作列表行：

```html
<div class="flex items-center justify-between px-4 py-3 rounded-md
  bg-ink-50 border border-ink-100
  hover:bg-ink-100 transition-colors duration-100">
  <div class="flex items-center gap-3 min-w-0">
    <Icon size={15} class="text-ink-400 shrink-0" />
    <div class="min-w-0">
      <div class="text-[13px] font-medium text-ink-600 truncate">标题</div>
      <div class="text-[11px] text-ink-400 truncate mt-0.5">副标题</div>
    </div>
  </div>
  <div class="flex items-center gap-3 shrink-0">
    <span class="text-xs text-ink-400">状态</span>
    <button class="btn-ghost-sm">操作</button>
  </div>
</div>
```

### 6.9 空状态 (Empty State)

```html
<div class="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div class="size-12 rounded-full bg-ink-50 flex items-center justify-center mb-4">
    <Icon size={24} class="text-ink-200" />
  </div>
  <h3 class="text-sm font-medium text-ink-500 mb-1">暂无数据</h3>
  <p class="text-xs text-ink-400 max-w-[240px]">解释为什么没有数据，以及如何创建。</p>
</div>
```

### 6.10 提示框 (Alert/Notice)

```html
<!-- 信息提示 -->
<div class="flex items-start gap-2.5 p-3 rounded-md bg-accent-light/50 border border-accent-light text-[13px] leading-relaxed">
  <Icon size={15} class="text-accent mt-px shrink-0" />
  <div><p class="font-medium text-accent-strong">标题</p><p class="text-ink-500 mt-0.5">详细说明文字</p></div>
</div>

<!-- 错误提示 -->
<div class="flex items-start gap-2.5 p-3 rounded-md bg-danger-light/50 border border-danger-light text-[13px] leading-relaxed">
  ...类似结构，颜色使用 danger 色板
</div>
```

---

## 7. 侧边栏设计

### 7.1 整体结构

侧边栏是应用的主要导航载体，采用深色工业风格：

```
+-------------------+
| [logo] InkOps      |  h-12,  logo + 产品名
+-------------------+
|                   |
|  @ 仪表盘    ^1   |  h-9  导航条目
|  *  AI任务    ^2  |
|  >  项目进度  ^3  |
|  #  数据看板  ^4  |
|  !  监控告警  ^5  |
|  ~  留言消息  ^6  |
|  =  历史归档  ^7  |
|  %  设备管理  ^8  |
|                   |
+-------------------+
| . NODE-01 在线    |  h-11 设备状态 (带状态点)
+-------------------+
```

### 7.2 导航条目

**未激活：**
```html
<button class="w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-left
  text-sm text-sidebar-text
  hover:bg-sidebar-hover hover:text-sidebar-text-active
  transition-colors duration-100">
  <Icon size={16} class="shrink-0 opacity-60 group-hover:opacity-100" />
  <span class="flex-1 truncate">仪表盘</span>
  <kbd class="text-[10px] font-mono opacity-40">^1</kbd>
</button>
```

**激活态：**
```html
<button class="w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-left
  text-sm font-semibold text-sidebar-text-active
  bg-sidebar-active">
  <Icon size={16} class="shrink-0 text-accent" />
  <span class="flex-1 truncate">仪表盘</span>
  <kbd class="text-[10px] font-mono opacity-60">^1</kbd>
</button>
```

### 7.3 侧边栏底部状态区

```html
<div class="px-4 py-3 border-t border-sidebar-border text-[11px] text-sidebar-text">
  <div class="flex items-center gap-2">
    <span class="inline-block size-2 rounded-full bg-success" />
    <span>NODE-01 在线</span>
  </div>
</div>
```

### 7.4 侧边栏组件完整代码（重构后）

```html
<aside class="flex flex-col shrink-0 select-none w-55 bg-sidebar-bg">
  <!-- Logo 区域 -->
  <div class="flex items-center gap-2.5 h-12 px-4 border-b border-sidebar-border shrink-0">
    <div class="size-6 rounded-md flex items-center justify-center shrink-0 bg-accent">
      <span class="text-[10px] font-bold text-white">I</span>
    </div>
    <span class="text-sm font-semibold tracking-tight text-sidebar-text-active">InkOps</span>
  </div>

  <!-- 导航区域 -->
  <nav class="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
    <!-- 导航条目在此映射 -->
  </nav>

  <!-- 设备状态 -->
  <div class="px-4 py-3 border-t border-sidebar-border text-[11px] text-sidebar-text shrink-0">
    <div class="flex items-center gap-2">
      <span class="inline-block size-2 rounded-full bg-success" />
      <span>NODE-01 在线</span>
    </div>
  </div>
</aside>
```

---

## 8. 状态栏设计

### 8.1 整体结构

状态栏 44px 高，浅色背景，底部边框分离。左对齐页面标题，右对齐系统状态。

```html
<header class="flex items-center justify-between h-11 px-5 shrink-0 select-none
  bg-white border-b border-ink-200">
  <!-- 左侧：当前页面标题 -->
  <div class="flex items-center gap-3">
    <span class="text-[13px] font-semibold text-ink-700">仪表盘</span>
  </div>

  <!-- 右侧：系统状态 -->
  <div class="flex items-center gap-4">
    <div class="flex items-center gap-1.5 text-[12px]">
      <span class="size-2 rounded-full bg-success" />
      <span class="text-ink-500">引擎在线</span>
    </div>
    <div class="flex items-center gap-1.5 text-[12px]">
      <span class="size-2 rounded-full bg-success" />
      <span class="text-ink-500">设备在线</span>
    </div>
    <span class="text-xs font-mono tabular-nums text-ink-400">14:32</span>
  </div>
</header>
```

### 8.2 面包屑

如果未来需要面包屑：
```html
<div class="flex items-center gap-1.5 text-[13px]">
  <span class="text-ink-400">InkOps</span>
  <span class="text-ink-300">/</span>
  <span class="font-semibold text-ink-700">仪表盘</span>
</div>
```

---

## 9. E-Ink 预览组件

### 9.1 设计定位

E-Ink 预览是仪表盘的 Hero 元素，需要在视觉上体现"硬件设备"的感觉。设计方向：模拟真实硬件外框，而非简单的图片容器。

### 9.2 组件重构

```html
<div class="relative inline-block group">
  <!-- 外层设备外壳 -->
  <div class="rounded-2xl p-5 bg-eink-case
    shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_20px_50px_-12px_rgba(0,0,0,0.25),0_4px_12px_-4px_rgba(0,0,0,0.15)]">

    <!-- 顶部装饰条 (模拟设备上边缘) -->
    <div class="flex items-center justify-center mb-4">
      <div class="w-12 h-1 rounded-full bg-white/[0.08]" />
    </div>

    <!-- 屏幕区域 -->
    <div class="overflow-hidden w-[400px] h-[300px] max-w-full
      bg-eink-screen
      shadow-[0_0_0_4px_#0f172a,0_0_0_5px_#334155,inset_0_1px_4px_rgba(0,0,0,0.06)]
      transition-shadow duration-300
      group-hover:shadow-[0_0_0_4px_#0f172a,0_0_0_5px_#334155,inset_0_1px_4px_rgba(0,0,0,0.06),0_0_30px_-10px_rgba(14,165,233,0.15)]">

      <!-- 实际图片或空状态 -->
      {imageUrl ? (
        <img src={imageUrl} class="w-full h-full object-contain"
             style="image-rendering: pixelated" />
      ) : (
        <!-- 空状态：NO SIGNAL 界面 -->
        <div class="w-full h-full flex flex-col items-center justify-center bg-eink-screen">
          <div class="text-ink-200/50">
            <Monitor size={36} strokeWidth={1} />
          </div>
          <div class="mt-4 text-[11px] font-mono tracking-[0.2em] text-ink-300">
            NO SIGNAL
          </div>
          <div class="mt-1.5 text-[10px] text-ink-300/60">
            等待页面生成...
          </div>
        </div>
      )}
    </div>

    <!-- 底部设备信息栏 -->
    <div class="flex items-center justify-between mt-4 px-1">
      <span class="text-[9px] font-mono tracking-[0.15em] text-white/25">
        4.2" E-PAPER · 400x300
      </span>
      <div class="flex items-center gap-1.5">
        <span class="text-[9px] font-mono text-white/25">
          {page ? 'READY' : 'IDLE'}
        </span>
        <span class={`size-2 rounded-full ${page ? 'bg-success' : 'bg-white/[0.15]'}`} />
      </div>
    </div>
  </div>
</div>
```

### 9.3 E-Ink 预览在页面中的定位

在仪表盘中，E-Ink 预览居中于页面顶部区域，下方跟随控制栏和 Grid 区域：

```
+--------------------------------------------------+
|                                                    |
|                 [E-Ink Preview]                    |
|                                                    |
|        [推送到设备]  [刷新]  [固定]                 |
|                                                    |
+--------------------------------------------------+
|  Stats Card  |  AI 推荐 Card  |  事件 Card         |
+--------------------------------------------------+
```

---

## 10. 各页面布局模板

### 10.1 仪表盘 (Bridge) — 模式 A

页面区域划分：
- 顶部：E-Ink 预览区 (居中)
- 中部：操作栏 (居中对齐)
- 底部：3 列网格 (Stats | AI 推荐 | 事件)

```
+--------------------------------------------------+
|                                                    |
|            [E-Ink Preview — 居中]                  |
|                                                    |
|         [推送到设备] [刷新] [固定]                  |
|                                                    |
+---------+---------------------+-------------------+
| 统计    | AI 推荐             | 最近事件           |
| - 候选  | P3 QUEST_SCROLL     | ◇ quest_123...    |
| - 在线  | 基于最近项目..      | ● system event... |
| - 推送  | 12 个候选页面       | ▲ alert_456...    |
| - 历史  |                     |                   |
+---------+---------------------+-------------------+
```

**Tailwind 布局：**
```html
<div class="h-full overflow-auto">
  <div class="p-6 space-y-6">
    <!-- E-Ink Hero 区域 -->
    <div class="flex flex-col items-center py-12">
      <EInkPreview page={currentPage} />
      <div class="flex items-center gap-2 mt-6">
        <button class="btn-primary"><Send size={14} />推送到设备</button>
        <button class="btn-secondary"><RefreshCw size={14} />刷新</button>
        <button class="btn-secondary"><Pin size={14} />固定</button>
      </div>
    </div>

    <!-- 底部 3 列 -->
    <div class="grid grid-cols-3 gap-5">
      <!-- 统计卡片 -->
      <Card header="统计">
        <div class="space-y-3">
          <StatItem icon={Layers} label="候选页面" value={4} />
          <StatItem icon={Clock} label="设备状态" value="在线" color="success" />
          <StatItem icon={Send} label="已推送" value="1" />
          <StatItem icon={FileText} label="历史记录" value={12} />
        </div>
      </Card>

      <!-- AI 推荐 -->
      <Card header="AI 推荐">
        {recommendation ? (
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <Badge color="accent">P{priority}</Badge>
              <span class="text-sm font-medium text-ink-600">{templateLabel}</span>
            </div>
            <p class="text-xs text-ink-500 leading-relaxed">{reason}</p>
            <p class="text-[11px] text-ink-400">{count} 个候选页面</p>
          </div>
        ) : <EmptyState />}
      </Card>

      <!-- 事件流 -->
      <Card header="事件">
        <EventList events={events} />
      </Card>
    </div>
  </div>
</div>
```

### 10.2 AI 任务 (Quest) — 模式 B

双栏等分，输入区 + 预览区。

```
+---------------------------+---------------------------+
| 输入待办                  | 预览                      |
| > 公会 > 舰桥 > 教官 > 毒舌 |                           |
|                           |   DAILY QUEST / LV.01     |
| [textarea:               |   ---------------------   |
|  1. 完成墨水屏接口        |   ★ 主线 ...              |
|  2. 修复留言页面          |   ◆ 支线 ...              |
|  3. 晚上健身]            |   ☠ BOSS ...             |
|                           |   🚫 禁止 ...             |
| [生成卷轴]               |   🏆 奖励 ...             |
|                           |   「宣言...」              |
|                           |                           |
|                           | [推送到墨水屏]            |
+---------------------------+---------------------------+
```

```html
<div class="h-full overflow-auto">
  <div class="p-6">
    <div class="grid grid-cols-2 gap-5 min-h-[calc(100vh-180px)]">
      <!-- 左：输入区 -->
      <Card header={<><Sparkles />输入待办</>} class="flex flex-col">
        <div class="flex-1 flex flex-col">
          <textarea class="flex-1 textarea" placeholder="写下今天要做的事..." />
          <div class="flex items-center justify-between pt-4 mt-4 border-t border-ink-100">
            <div class="flex gap-1">
              {personas.map(p => (
                <button class={`btn-sm ${active ? 'bg-accent-light text-accent' : 'text-ink-400'}`}>
                  {label}
                </button>
              ))}
            </div>
            <button class="btn-primary"><Sparkles />生成卷轴</button>
          </div>
        </div>
      </Card>

      <!-- 右：预览区 -->
      <Card header="预览" class="flex flex-col">
        <div class="flex-1 flex flex-col overflow-auto">
          {quest ? (
            <>
              <div class="flex-1 mono-block"><!-- 任务卷轴内容 --></div>
              <button class="btn-primary w-full mt-4"><Send />推送到墨水屏</button>
            </>
          ) : <EmptyState />}
        </div>
      </Card>
    </div>
  </div>
</div>
```

**人格选择按钮改进：**
```html
<div class="flex bg-ink-50 rounded p-0.5 gap-0.5">
  {personas.map(p => (
    <button
      class={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-100
        ${active === p
          ? 'bg-white text-ink-700 shadow-sm'
          : 'text-ink-400 hover:text-ink-500'}`}>
      {label}
    </button>
  ))}
</div>
```
使用分段控件 (segmented control) 替代分散的按钮，更现代。

### 10.3 项目进度 (Launch) — 模式 C

约束单列，居中。包含输入区和结果显示。

```html
<div class="h-full overflow-auto">
  <div class="p-6">
    <div class="max-w-xl mx-auto space-y-5">
      <Card header={<><Rocket />项目进度</>}>
        {!briefing ? (
          <!-- 输入区 -->
          <div class="space-y-4">
            <p class="text-sm text-ink-500">输入产品名称，AI 分析上线路径并给出今日唯一关键行动。</p>
            <div class="flex gap-3">
              <input class="input flex-1" placeholder="产品名称" />
              <button class="btn-primary"><Rocket />开始分析</button>
            </div>
          </div>
        ) : (
          <!-- 结果区 -->
          <div class="space-y-5">
            <div>
              <div class="flex justify-between text-sm mb-2">
                <span class="text-ink-500">{name}</span>
                <span class="font-semibold text-accent">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>

            {blockers.length > 0 && (
              <Alert type="danger" title="阻塞项">
                {blockers.map(b => <div>• {b}</div>)}
              </Alert>
            )}

            <div class="flex items-center gap-2 text-sm text-ink-500">
              <Clock size={14} class="text-warning" />
              距上线 T-{days} 天
            </div>

            <Alert type="info" title="AI 今日指令">
              <p class="text-base font-medium text-ink-700">{instruction}</p>
            </Alert>
          </div>
        )}
      </Card>
    </div>
  </div>
</div>
```

### 10.4 数据看板 (Terminal) — 模式 A

单列居中，mono 风格数据展示。

```html
<div class="h-full overflow-auto">
  <div class="p-6">
    <div class="max-w-lg mx-auto">
      <Card header={<><Monitor />数据看板 <RefreshButton /></>}>
        <div class="mono-block space-y-3 text-[13px] leading-relaxed">
          <div class="text-center text-[11px] text-accent tracking-wider">
            INKOPS TERMINAL / NODE-01
          </div>
          <div class="h-px bg-ink-100 my-1" />
          <div class="flex justify-between">
            <span class="text-ink-400">活跃项目</span>
            <span class="text-ink-700 font-mono">{activeProject}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-400">GitHub 连续</span>
            <span class="text-ink-700 font-mono">{streak} 天</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-400">今日提交</span>
            <span class="text-ink-700 font-mono">{commits}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-400">服务状态</span>
            <span class={`font-mono font-semibold ${online ? 'text-success' : 'text-danger'}`}>
              {online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div class="h-px bg-ink-100 my-1" />
          <div class="flex justify-between">
            <span class="text-ink-400">MVP 进度</span>
            <span class="text-accent font-mono font-semibold">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
          <div class="h-px bg-ink-100 my-1" />
          <div>
            <div class="text-ink-400 mb-1">当前聚焦</div>
            <div class="text-ink-700">{focus}</div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</div>
```

其中 `mono-block` 样式统一为：
```html
<div class="rounded-lg bg-ink-25 border border-ink-100 p-5
  font-mono text-[13px] leading-relaxed">
```

### 10.5 监控告警 (Watcher) — 模式 C

列表式布局，顶部添加表单，下方活跃告警。

```html
<div class="h-full overflow-auto">
  <div class="p-6">
    <div class="max-w-xl mx-auto space-y-4">
      <!-- 监控列表 -->
      <Card header={<><ShieldAlert />监控告警 <Button sm>+ 添加</Button></>}>
        {/* 添加表单 (条件显示) */}
        {showForm && (
          <div class="px-5 py-3 flex gap-2 border-b border-ink-100 bg-ink-25">
            <input class="input w-32" placeholder="名称" />
            <input class="input flex-1" placeholder="https://..." />
            <button class="btn-primary-sm">确定</button>
          </div>
        )}

        <div class="p-5 space-y-1.5">
          {monitors.map(m => <MonitorRow item={m} />)}
          {monitors.length === 0 && <EmptyState />}
        </div>
      </Card>

      {/* 活跃告警 */}
      {incidents.length > 0 && (
        <Card header={<><Activity />活跃告警 ({incidents.length})</>}>
          <div class="p-5 space-y-2">
            {incidents.map(inc => <IncidentAlert item={inc} />)}
          </div>
        </Card>
      )}
    </div>
  </div>
</div>
```

### 10.6 留言消息 (Signals) — 模式 B2

不等宽双栏 + 底部消息列表。

```html
<div class="h-full overflow-auto">
  <div class="p-6">
    <div class="max-w-4xl mx-auto space-y-4">
      <!-- 上排：QR + 发送 (等宽双栏) -->
      <div class="grid grid-cols-2 gap-4">
        <Card header={<><QrCode />留言二维码</>}>
          <div class="flex flex-col items-center gap-4 py-6">
            <QrCode size={80} class="text-ink-200" />
            <p class="text-xs text-ink-400">生成专属留言入口二维码</p>
            <button class="btn-secondary-sm"><QrCode />生成</button>
            {qr && <div class="w-full p-3 rounded bg-ink-25 font-mono text-[10px] text-ink-400 break-all">{qr.data}</div>}
          </div>
        </Card>

        <Card header={<><Send />发送留言</>}>
          <div class="space-y-4">
            <input class="input" placeholder="署名 (可选)" />
            <div class="space-y-2">
              <input class="input" placeholder="留言内容 (最多80字)" />
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-ink-400">{len}/80</span>
                <button class="btn-primary-sm"><Send />发送</button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- 下排：留言列表 (全宽) -->
      <Card header={<><MessageSquare />最近留言 ({count})</>}>
        <div class="p-5 max-h-60 overflow-auto space-y-1.5">
          {messages.map(m => <MessageRow item={m} />)}
          {messages.length === 0 && <EmptyState />}
        </div>
      </Card>
    </div>
  </div>
</div>
```

### 10.7 历史归档 (Studio) — 模式 C

居中单列，列表式展示页面历史。

```html
<div class="h-full overflow-auto">
  <div class="p-6">
    <div class="max-w-xl mx-auto">
      <Card header={<><Archive />历史归档 <RefreshButton /></>}>
        <div class="p-5 space-y-1.5">
          {pages.map(p => (
            <div class="flex items-center justify-between p-3 rounded-md
              bg-ink-50 border border-ink-100">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-[13px] font-medium text-ink-600 truncate">{p.templateId}</span>
                  <Badge color={statusColor(p.status)}>{p.status}</Badge>
                </div>
                <div class="text-[11px] text-ink-400 mt-0.5 truncate">
                  {p.reason} · {p.createdAt?.slice(0, 16)}
                </div>
              </div>
              <button class="btn-secondary-xs shrink-0 ml-3">重渲染</button>
            </div>
          ))}
          {pages.length === 0 && <EmptyState />}
        </div>
      </Card>
    </div>
  </div>
</div>
```

### 10.8 设备管理 (Device) — 模式 C

最简布局，居中窄列。

```html
<div class="h-full overflow-auto">
  <div class="p-6">
    <div class="max-w-xs mx-auto space-y-3">
      <!-- 设备信息卡片 -->
      <Card header={<><Cpu />设备管理</>}>
        {device ? (
          <div class="text-center space-y-5 py-4">
            <div class="size-14 mx-auto rounded-full bg-purple-light flex items-center justify-center">
              <Cpu size={24} class="text-purple" />
            </div>
            <div class="rounded-lg bg-ink-25 border border-ink-100 p-4
              font-mono text-[13px] leading-relaxed space-y-2 text-left">
              <Row label="名称" value={device.name} />
              <Row label="IP" value={device.ip ?? '--'} />
              <Row label="型号" value={device.model} />
            </div>
            <div class="flex items-center justify-center gap-2">
              <StatusDot status={device.status} />
              <span class={`text-xs ${online ? 'text-success' : 'text-ink-400'}`}>
                {online ? '在线' : '离线'}
              </span>
            </div>
            <button class="btn-secondary w-full"><RefreshCw />重新搜索</button>
          </div>
        ) : (
          <div class="text-center py-10">
            <Wifi size={36} class="mx-auto mb-4 text-ink-200" />
            <p class="text-sm text-ink-400">未发现设备</p>
            <p class="text-[11px] text-ink-400 mt-1">确保 ESP8266 在同一网络</p>
            <button class="btn-secondary w-full mt-5"><RefreshCw />搜索设备</button>
          </div>
        )}
      </Card>

      <!-- 手动绑定卡片 -->
      <Card>
        <div class="p-5 space-y-3">
          <p class="text-xs text-ink-400">手动绑定</p>
          <div class="flex gap-2">
            <input class="input flex-1" placeholder="192.168.10.211" />
            <button class="btn-primary-sm">连接</button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</div>
```

---

## 11. 动画与过渡

### 11.1 过渡时间基准

| 属性 | 持续时间 | easing | 用途 |
|------|---------|--------|------|
| 颜色 (bg, text, border) | 100-150ms | ease | 悬停状态 |
| 透明度 | 150ms | ease | 元素出现/消失 |
| 位置 (transform) | 200ms | ease-out | 小位移 |
| 弹窗出现 | 150ms | ease-out | 下拉菜单 |
| 进度条 | 600ms | ease-out | 进度更新 |

### 11.2 Framer Motion 动画 (推荐)

已有 `framer-motion` 依赖，可用于以下场景：

**页面切换动画：**
```tsx
import { motion, AnimatePresence } from 'framer-motion'

// 在 AppShell 中
<AnimatePresence mode="wait">
  <motion.main
    key={activeChannel}
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.12, ease: 'easeOut' }}
    class="flex-1 overflow-hidden"
  >
    <Page />
  </motion.main>
</AnimatePresence>
```

**列表项逐个出现 (staggerChildren)：**
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.03 } }
  }}
>
  {items.map((item, i) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <ItemRow item={item} />
    </motion.div>
  ))}
</motion.div>
```

**卡片 hover 微提升 (推荐使用 Tailwind 过渡，不过度使用 Framer)：**
```html
<div class="transition-shadow duration-200
  shadow-xs hover:shadow-sm" />
```

### 11.3 CSS Transition (用于简单交互)

```css
/* 所有交互元素的基础过渡 */
.btn, .input, .textarea, .card-clickable {
  transition: background-color 100ms ease,
              color 100ms ease,
              border-color 100ms ease,
              box-shadow 100ms ease;
}

/* 导航条目过渡 */
.nav-item {
  transition: background-color 75ms ease,
              color 75ms ease;
}
```

### 11.4 动画原则

1. **不要为动而动**：动画用于传达状态变化，而非纯装饰
2. **快而非急**：交互反馈在 80-150ms 之间，让人感觉即时
3. **E-Ink 预览的 hover 光晕**：微妙的发光效果模拟硬件连接感（见 9.2 节的 `group-hover:shadow`）
4. **页面切换**：使用 `y: 4px` 微位移 + `opacity` 过渡，不要大幅度动画
5. **数据更新**：进度条宽度使用 CSS transition，不闪烁

---

## 12. Tailwind v4 主题配置

### 12.1 在 src/index.css 中的完整配置

删除现有 index.css 中的手写 CSS，替换为以下内容：

```css
@import "tailwindcss";

/* ================================================================
   InkOps Terminal — Design System v2.0
   Tailwind v4 Theme Configuration
   ================================================================ */

@theme {
  /* ---- 字体 ---- */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", "SF Mono", monospace;

  /* ---- 主色板: Ink (冷灰) ---- */
  --color-ink-25: #fbfbfb;
  --color-ink-50: #f6f6f7;
  --color-ink-100: #eeeff0;
  --color-ink-150: #e4e5e7;
  --color-ink-200: #d1d3d6;
  --color-ink-300: #a3a7ad;
  --color-ink-400: #727780;
  --color-ink-500: #535860;
  --color-ink-600: #3e4149;
  --color-ink-700: #272930;
  --color-ink-800: #16171c;
  --color-ink-900: #0b0c0e;
  --color-ink-925: #060708;

  /* ---- 侧边栏色板 ---- */
  --color-sidebar-bg: #0b0c0e;
  --color-sidebar-hover: #18191d;
  --color-sidebar-active: #222327;
  --color-sidebar-border: #1a1b1f;
  --color-sidebar-text: #6b6f78;
  --color-sidebar-text-active: #eeeff0;

  /* ---- 语义色 ---- */
  --color-accent: #0ea5e9;
  --color-accent-light: #e0f2fe;
  --color-accent-strong: #0284c7;
  --color-success: #10b981;
  --color-success-light: #d1fae5;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-danger: #ef4444;
  --color-danger-light: #fee2e2;
  --color-purple: #8b5cf6;
  --color-purple-light: #ede9fe;

  /* ---- E-Ink 专用 ---- */
  --color-eink-case: #1e293b;
  --color-eink-screen: #fafaf9;
  --color-eink-text: #1c1917;

  /* ---- 字号 ---- */
  --text-2xs: 0.6875rem;      /* 11px */
  --text-2xs--line-height: 1rem;
  --text-xs: 0.78125rem;      /* 12.5px */
  --text-xs--line-height: 1.125rem;
  --text-sm: 0.84375rem;      /* 13.5px */
  --text-sm--line-height: 1.25rem;
  --text-base: 0.9375rem;     /* 15px */
  --text-base--line-height: 1.375rem;

  /* ---- 间距 ---- */
  --spacing-13: 3.25rem;      /* 52px */
  --spacing-14: 3.5rem;       /* 56px */
  --spacing-15: 3.75rem;      /* 60px */
  --spacing-17: 4.25rem;      /* 68px */
  --spacing-18: 4.5rem;       /* 72px */
  --spacing-55: 13.75rem;     /* 220px 侧边栏宽度 */

  /* ---- 圆角 ---- */
  --radius-xs: 0.25rem;       /* 4px — buttons, inputs */
  --radius-sm: 0.375rem;      /* 6px — small cards */
  --radius-md: 0.5rem;        /* 8px — cards */
  --radius-lg: 0.75rem;       /* 12px — large cards */
  --radius-xl: 1rem;          /* 16px — hero areas, device shell */

  /* ---- 阴影 ---- */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.03);
  --shadow-eink: 0 20px 50px -12px rgb(0 0 0 / 0.25), 0 4px 12px -4px rgb(0 0 0 / 0.15);
  --shadow-eink-glow: 0 0 30px -10px rgb(14 165 233 / 0.15);
}

/* ================================================================
   Global Styles
   ================================================================ */

/* Base reset */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-sans);
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--color-ink-600);
  background: var(--color-ink-25);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-ink-200);
  border-radius: 20px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-ink-300);
}

/* Focus visible ring */
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Selection color */
::selection {
  background: var(--color-accent-light);
  color: var(--color-accent-strong);
}

/* ================================================================
   Component Utilities (Tailwind @utility layer)
   ================================================================ */

@utility card {
  background: white;
  border: 1px solid var(--color-ink-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
}

@utility card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.75rem;
  padding: 0 1.25rem;
  border-bottom: 1px solid var(--color-ink-100);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-ink-500);
  user-select: none;
}

@utility card-body {
  padding: 1.25rem;
}

@utility card-body-flush {
  padding: 0;
}

@utility btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  height: 2.125rem;
  padding: 0 0.875rem;
  font-size: var(--text-sm);
  font-weight: 500;
  font-family: var(--font-sans);
  line-height: 1;
  border-radius: var(--radius-xs);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.1s ease;
  white-space: nowrap;
  user-select: none;
  outline: none;
}

@utility btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

@utility btn-primary {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}
@utility btn-primary:hover:not(:disabled) {
  background: var(--color-accent-strong);
  border-color: var(--color-accent-strong);
}

@utility btn-secondary {
  background: white;
  color: var(--color-ink-500);
  border-color: var(--color-ink-200);
}
@utility btn-secondary:hover:not(:disabled) {
  background: var(--color-ink-50);
  color: var(--color-ink-600);
  border-color: var(--color-ink-300);
}

@utility btn-ghost {
  background: transparent;
  color: var(--color-ink-400);
}
@utility btn-ghost:hover:not(:disabled) {
  background: var(--color-ink-50);
  color: var(--color-ink-600);
}

@utility btn-sm {
  height: 1.75rem;
  padding: 0 0.625rem;
  font-size: 0.75rem;
}
@utility btn-xs {
  height: 1.5rem;
  padding: 0 0.5rem;
  font-size: 0.6875rem;
}

@utility input {
  width: 100%;
  height: 2.125rem;
  padding: 0 0.625rem;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  color: var(--color-ink-600);
  background: white;
  border: 1px solid var(--color-ink-200);
  border-radius: var(--radius-xs);
  outline: none;
  transition: border-color 0.1s, box-shadow 0.1s;
}
@utility input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}
@utility input::placeholder {
  color: var(--color-ink-300);
}

@utility textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  line-height: 1.65;
  color: var(--color-ink-600);
  background: white;
  border: 1px solid var(--color-ink-200);
  border-radius: var(--radius-xs);
  outline: none;
  resize: none;
  transition: border-color 0.1s, box-shadow 0.1s;
}
@utility textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}
@utility textarea::placeholder {
  color: var(--color-ink-300);
}

@utility badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  height: 1.375rem;
  padding: 0 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1;
  border-radius: var(--radius-xs);
  white-space: nowrap;
}

@utility badge-accent  { background: var(--color-accent-light);  color: var(--color-accent-strong); }
@utility badge-success  { background: var(--color-success-light); color: var(--color-success); }
@utility badge-warning  { background: var(--color-warning-light); color: var(--color-warning); }
@utility badge-danger   { background: var(--color-danger-light);  color: var(--color-danger); }
@utility badge-purple   { background: var(--color-purple-light);  color: var(--color-purple); }
@utility badge-neutral  { background: var(--color-ink-100);       color: var(--color-ink-500); }

@utility status-dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  flex-shrink: 0;
}
@utility dot-online  { background: var(--color-success); }
@utility dot-offline { background: var(--color-ink-300); }
@utility dot-warning { background: var(--color-warning); }
@utility dot-active  { background: var(--color-accent); }

@utility mono-block {
  background: var(--color-ink-25);
  border: 1px solid var(--color-ink-100);
  border-radius: var(--radius-sm);
  padding: 1rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.7;
  color: var(--color-ink-500);
}
@utility mono-block .mlabel { color: var(--color-ink-400); }
@utility mono-block .mvalue { color: var(--color-ink-600); }

@utility progress {
  width: 100%;
  height: 0.25rem;
  background: var(--color-ink-100);
  border-radius: 2px;
  overflow: hidden;
}
@utility progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--color-accent);
  transition: width 0.6s ease;
}

@utility alert {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  line-height: 1.5;
}
@utility alert-danger  { background: var(--color-danger-light);  border: 1px solid var(--color-danger-light); }
@utility alert-info    { background: var(--color-accent-light);  border: 1px solid var(--color-accent-light); }
@utility alert-success { background: var(--color-success-light); border: 1px solid #a7f3d0; }

@utility empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  text-align: center;
}
@utility empty-icon { color: var(--color-ink-200); margin-bottom: 0.75rem; }
@utility empty-title { font-size: var(--text-sm); font-weight: 500; color: var(--color-ink-500); margin-bottom: 0.25rem; }
@utility empty-desc { font-size: 0.75rem; color: var(--color-ink-400); }

@utility sep {
  height: 1px;
  background: var(--color-ink-100);
  margin: 0.75rem 0;
}

@utility page {
  height: 100%;
  overflow: auto;
}

@utility fade-in {
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ================================================================
   E-Ink Preview Shadow (复合阴影)
   ================================================================ */
@utility shadow-eink-device {
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.05) inset,
    0 20px 50px -12px rgb(0 0 0 / 0.25),
    0 4px 12px -4px rgb(0 0 0 / 0.15);
}

@utility shadow-eink-screen {
  box-shadow:
    0 0 0 4px #0f172a,
    0 0 0 5px #334155,
    inset 0 1px 4px rgb(0 0 0 / 0.06);
}

@utility shadow-eink-screen-glow {
  box-shadow:
    0 0 0 4px #0f172a,
    0 0 0 5px #334155,
    inset 0 1px 4px rgb(0 0 0 / 0.06),
    0 0 30px -10px rgb(14 165 233 / 0.15);
}
```

### 12.2 不再需要 tailwind.config.js

Tailwind v4 使用 CSS-based 配置，无需 JS 配置文件。检查项目是否可以删除旧的 `tailwind.config.*`。

---

## 13. 实施指南

### 13.1 迁移顺序

建议按以下顺序逐步实施，每步完成后验证所有页面正常渲染：

1. **更新 index.css** — 替换现有 CSS 为上述 Tailwind v4 主题配置
2. **重构 Sidebar** — 使用 Tailwind 工具类替换 inline styles
3. **重构 StatusBar** — 使用 Tailwind 工具类
4. **重构 EInkPreview** — 使用新的 shadow utilities
5. **重构 BridgePage** — 作为模板，后续页面照此模式
6. **重构 QuestPage** — 分段控件模式
7. **重构其余 5 页** — Launch, Terminal, Watcher, Signals, Studio, Device
8. **添加 Framer Motion** — 页面切换和列表动画
9. **微调** — 间距、字体大小、颜色对比度微调

### 13.2 实施检查清单

每步完成后检查：

- [ ] 无控制台报错
- [ ] 所有 8 个页面正常渲染
- [ ] 侧边栏导航切换正常
- [ ] 按钮交互状态 (hover, active, disabled) 正确
- [ ] 输入框 focus 状态正确
- [ ] E-Ink 预览组件外观一致
- [ ] 深色侧边栏与浅色内容区对比协调
- [ ] 无横向溢出
- [ ] 无硬编码颜色值 (全部使用 Tailwind class 或 CSS 变量)

### 13.3 颜色迁移映射

现有 CSS 变量 -> 新 Tailwind class：

| 旧变量 | 新 Tailwind Class | 说明 |
|--------|-------------------|------|
| `var(--bg-page)` | `bg-ink-25` | 页面背景 |
| `var(--bg-surface)` | `bg-white` | 卡片背景 |
| `var(--bg-surface-secondary)` | `bg-ink-50` | 次级表面 |
| `var(--bg-surface-hover)` | `bg-ink-100` | 表面悬停 |
| `var(--border-default)` | `border-ink-200` | 默认边框 |
| `var(--border-subtle)` | `border-ink-100` | 微细边框 |
| `var(--text-primary)` | `text-ink-600` | 主正文 |
| `var(--text-secondary)` | `text-ink-500` | 次级正文 |
| `var(--text-tertiary)` | `text-ink-400` | 三级正文 |
| `var(--text-disabled)` | `text-ink-300` | 禁用文字 |
| `var(--interactive-primary)` | `bg-accent` / `text-accent` | 主交互色 |
| `var(--interactive-primary-hover)` | `hover:bg-accent-strong` | 悬停交互色 |
| `var(--interactive-primary-bg)` | `bg-accent-light` | 交互色背景 |
| `var(--color-success)` | `text-success` | 成功色 |
| `var(--color-warning)` | `text-warning` | 警告色 |
| `var(--color-danger)` | `text-danger` | 危险色 |
| `var(--color-purple)` | `text-purple` | 紫色 |
| `var(--sidebar-bg)` | `bg-sidebar-bg` | 侧边栏背景 |
| `var(--sidebar-hover)` | `hover:bg-sidebar-hover` | 侧边栏悬停 |
| `var(--sidebar-active)` | `bg-sidebar-active` | 侧边栏激活 |
| `var(--sidebar-text)` | `text-sidebar-text` | 侧边栏文字 |
| `var(--sidebar-text-active)` | `text-sidebar-text-active` | 侧边栏激活文字 |
| `var(--sidebar-border)` | `border-sidebar-border` | 侧边栏分割线 |
| `var(--header-h)` | `h-11` | 状态栏高度 |
| `var(--sidebar-w)` | `w-55` | 侧边栏宽度 |
| `var(--font-sans)` | `font-sans` | 正文字体 |
| `var(--font-mono)` | `font-mono` | 等宽字体 |

### 13.4 注意事项

1. **Tailwind v4 的 `@utility`** 指令是实验性的，如果构建报错，可以将 `.btn`、`.card` 等组件类改为使用 `@layer components { ... }` 包装，或者直接使用纯 Tailwind 工具类组合 (utility-first)。
2. **Shadow 变量**：Tailwind v4 的 `--shadow-*` 自定义需要在 `@theme` 中定义后才能通过 `shadow-xs` 等 class 使用。
3. **Framer Motion**：页面切换动画使用 `AnimatePresence`，请确保 `AppShell` 中有正确的 `key` 绑定。
4. **渐进迁移**：可以先保留 `@utility` 定义的 `.card`/`.btn` 等类名，让现有 JSX 中的 `className="card"` 继续工作，后续再逐步改为纯 Tailwind 类名。
5. **确保引入 Inter 和 JetBrains Mono 字体**：在 `index.html` 中添加 Google Fonts 或本地字体文件的 `<link>` 标签。

---

*本文档随设计系统迭代更新。所有参与者应在修改组件前先参考此规范。*
