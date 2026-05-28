# InkOps Terminal — UI 规格说明书 V1.0

## 视觉方向

**黑客终端 + 深色控制舱 + 荧光绿/警告红点缀**

- 桌面 App 使用浅色控制舱风格 (便于长时间阅读)
- 墨水屏页面使用高对比黑白风格 (适配电子纸)
- 终端/代码类页面使用等宽字体

## 设计 Token

```
--color-bg-primary:   #f7f7f7   主背景
--color-bg-card:      #ffffff   卡片背景
--color-border:       #e8e8e8   边框
--color-text-primary: #111111   主文字
--color-accent:       #0ea5e9   主色调 (天蓝)
--color-warning:      #d97706   警告 (橙)
--color-danger:       #dc2626   危险 (红)
--color-purple:       #7c3aed   AI 相关 (紫)
--color-success:      #16a34a   成功 (绿)

--font-mono:  "JetBrains Mono", "Fira Code", monospace
--font-sans:  "Inter", system-ui, sans-serif
```

## 导航结构 (8 频道)

```
Ctrl+1  Bridge    总指挥舱    屏幕预览 + AI 推荐 + 事件流
Ctrl+2  Quest     任务铸造    输入待办 + AI 生成卷轴 + 推送
Ctrl+3  Launch    上线发射    项目创建 + AI 简报 + 倒计时
Ctrl+4  Terminal  作战终端    GitHub 提交 + 服务状态 + 进度条
Ctrl+5  Watcher   守夜人      监控配置 + 健康检测 + 告警列表
Ctrl+6  Signals   信号箱      QR 码 + 留言模拟 + 明信片
Ctrl+7  Studio    战报档案    页面历史 + 重渲染 + 导出
Ctrl+8  Device    设备管理    扫描 + 绑定 + 状态
```

## 墨水屏页面规格

| 属性 | 值 |
|------|-----|
| 分辨率 | 400 × 300 px |
| 颜色 | 黑白二值 (1-bit) |
| 渲染方式 | Python Pillow → Floyd-Steinberg 抖动 |
| 字体 | DroidSansFallbackFull (中文) / NotoSansMono (等宽) |

## 6 个模板布局

### QUEST_SCROLL — 任务卷轴

```
╔══════════════════════╗
║   DAILY QUEST         ║
║   LV.01               ║
║───────────────────────║
║ MAIN QUEST            ║
║ 完成自动刷新接口       ║
║ SIDE QUEST            ║
║ □ 修复二维码入口      ║
║ □ 力量训练            ║
║───────────────────────║
║ BOSS: 需求膨胀魔王    ║
║ WEAKNESS: 先交付      ║
║───────────────────────║
║ BAN: 今天禁止开新坑   ║
║ REWARD: 解锁演示视频  ║
║───────────────────────║
║ 「Build. Ship. Display.」
╚══════════════════════╝
```

### TERMINAL_STATUS — 作战终端

```
╔══════════════════════╗
║ INKOPS TERMINAL       ║
║ NODE-01 // ACTIVE     ║
║───────────────────────║
║ PROJECT: InkOps       ║
║ Commits Today: 12     ║
║ [ONLINE] Services     ║
║ MVP PROGRESS: 65%     ║
║ [████████░░░░░░░]     ║
║───────────────────────║
║ CURRENT FOCUS:        ║
║ 完成 Quest 卷轴上屏   ║
║───────────────────────║
║ > Build. Ship. Repeat.║
╚══════════════════════╝
```

### LAUNCH_PANEL — 发射台

```
╔══════════════════════╗
║ LAUNCH CONTROL        ║
║ InkOps Terminal       ║
║───────────────────────║
║ TARGET: V0.2   T-14d  ║
║ COMPLETED:            ║
║ [✓] Quest API         ║
║ [✓] Bridge UI         ║
║ BLOCKERS:             ║
║ [!!] CI/CD 未就绪     ║
║ PROGRESS: 65%         ║
║ [████████░░░░░░░]     ║
║───────────────────────║
║ TODAY: 修复部署脚本   ║
║───────────────────────║
║ LAUNCH. SHIP. REPEAT. ║
╚══════════════════════╝
```

### SYSTEM_ALERT — 告警

```
╔══════════════════════╗
║ !! SYSTEM ALERT [P1] !!║
║───────────────────────║
║ TARGET: xzspace.tech  ║
║ STATUS: OFFLINE       ║
║ DIAGNOSIS:            ║
║ 服务不可达             ║
║ FIRST ACTION:         ║
║ 检查 Nginx 与服务状态  ║
║───────────────────────║
║ CHECKED: 2026-05-28   ║
║ MONITORING ACTIVE     ║
╚══════════════════════╝
```

### POSTCARD — 明信片

```
╔══════════════════════╗
║  ┌──────┐             ║
║  │ INK  │             ║
║  │ OPS  │             ║
║  └──────┘             ║
║ ✉ SIGNAL RECEIVED    ║
║───────────────────────║
║ 加油! 你正在创造      ║
║ 很棒的东西!            ║
║───────────────────────║
║ FROM: 未来的你         ║
║ INKOPS SIGNAL BOX     ║
╚══════════════════════╝
```

### RELEASE_NEWS — 战报

```
╔══════════════════════╗
║ INKOPS DAILY          ║
║ 2026-05-28            ║
║ QUEST SCROLL 上屏成功! ║
║ 首个 AI 任务卷轴上线   ║
║───────────────────────║
║ TODAY'S ACHIEVEMENTS: ║
║ ★ Quest 端到端闭环    ║
║ ★ 4 种 AI 人格可用    ║
║───────────────────────║
║ NEXT:                 ║
║ → 接入 GitHub 真实数据 ║
║ → 实现监控自动告警    ║
║───────────────────────║
║ Build. Ship. Display. ║
╚══════════════════════╝
```
