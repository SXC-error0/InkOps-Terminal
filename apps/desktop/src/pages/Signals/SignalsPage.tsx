import { useState, useEffect, useRef } from "react"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"

// ── Pomodoro Timer ────────────────────────────────────────────────

function PomodoroTimer({ onPush }: { onPush: (label: string) => void }) {
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [task, setTask] = useState("")
  const [history] = useState(["UI 组件审查", "文档更新"])
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    } else {
      if (ref.current) clearInterval(ref.current)
    }
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [running])

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0")
  const ss = String(seconds % 60).padStart(2, "0")

  return (
    <section className="xl:col-span-4 bg-surface-container-lowest border border-outline-variant flex flex-col">
      <header className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface-container-low/50">
        <h3 className="font-mono text-[11px] text-on-surface uppercase tracking-wider">番茄钟与专注</h3>
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">timer</span>
      </header>
      <div className="p-6 flex-1 flex flex-col items-center">
        <div className={`font-mono text-[64px] text-primary leading-none mb-6 mt-4 tracking-tight ${seconds <= 60 && running ? "text-error" : ""}`}>
          {mm}:{ss}
        </div>
        <input
          className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-secondary focus:ring-0 font-mono text-[13px] text-on-surface text-center mb-6 placeholder-on-surface-variant/50 outline-none"
          placeholder="当前任务..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />
        <div className="flex gap-3 w-full mb-8">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex-1 py-2 bg-primary text-on-primary text-[14px] hover:opacity-90 transition-opacity"
          >
            {running ? "暂停" : "开始"}
          </button>
          <button
            onClick={() => { setRunning(false); setSeconds(25 * 60) }}
            className="px-4 py-2 border border-outline-variant text-primary hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">stop</span>
          </button>
          <button
            onClick={() => onPush("番茄钟状态")}
            className="px-3 py-2 border border-outline-variant text-secondary hover:bg-secondary-container/30 transition-colors"
            title="推送到屏幕"
          >
            <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
          </button>
        </div>
        <div className="w-full border-t border-outline-variant pt-4">
          <p className="font-mono text-[11px] text-on-surface-variant mb-2">最近记录</p>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h} className="flex justify-between items-center text-[12px] font-mono">
                <span className="text-on-surface truncate pr-2">{h}</span>
                <span className="text-secondary font-bold">25m</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// ── Clock Style Card ──────────────────────────────────────────────

const CLOCK_STYLES = [
  { id: "minimal", label: "Minimal", preview: <span className="font-mono font-bold text-[28px] text-primary">10:42</span> },
  {
    id: "datetime",
    label: "Date/Time",
    preview: (
      <div className="flex flex-col items-center">
        <span className="font-mono font-bold text-xl text-primary">10:42</span>
        <span className="font-mono text-[11px] text-on-surface-variant">2024.06.25</span>
      </div>
    ),
  },
  {
    id: "health",
    label: "Device Health",
    preview: (
      <div className="w-full flex flex-col gap-1 p-2">
        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
          <div className="w-3/4 h-full bg-on-surface rounded-full" />
        </div>
        <span className="font-mono text-[10px] text-on-surface-variant">CPU 42%</span>
      </div>
    ),
  },
]

// ── Countdown Item ────────────────────────────────────────────────

function CountdownItem({
  label,
  days,
  urgency,
  targetDate,
  onPush,
}: {
  label: string
  days: number
  urgency: "critical" | "normal"
  targetDate: string
  onPush: () => void
}) {
  const accent = urgency === "critical" ? "bg-error" : "bg-secondary-container"
  const badge = urgency === "critical" ? "border-error text-error" : "border-secondary text-secondary"

  return (
    <div className="border border-outline-variant p-4 relative overflow-hidden group hover:border-outline transition-colors">
      <div className={`absolute top-0 left-0 w-1 h-full ${accent}`} />
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className={`px-1.5 py-0.5 border font-mono text-[9px] mb-1 inline-block ${badge}`}>
            {urgency === "critical" ? "CRITICAL" : "NORMAL"}
          </span>
          <h4 className="font-display font-semibold text-primary text-base">{label}</h4>
        </div>
        <div className="text-right">
          <span className="font-display font-bold text-[32px] leading-none text-primary">{days}</span>
          <span className="font-mono text-[10px] text-on-surface-variant block">天</span>
        </div>
      </div>
      <div className="flex justify-between items-center border-t border-outline-variant/50 pt-2 mt-2">
        <span className="font-mono text-[11px] text-on-surface-variant">目标日期: {targetDate}</span>
        <button onClick={onPush} className="text-primary hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-[16px]">present_to_all</span>
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export function SignalsPage() {
  const [activeClockStyle, setActiveClockStyle] = useState("minimal")
  const [incomeGoal] = useState(45000)
  const [incomeAchieved] = useState(29250)
  const [exploration, setExploration] = useState<string | null>(null)

  const device = useDeviceStore((s) => s.device)
  const addEvent = useEventStore((s) => s.addEvent)

  const pushToDevice = async (label: string) => {
    if (!device) { addEvent({ type: "alert", message: "设备未绑定，无法推送" }); return }
    try {
      const pages = await api.getPageHistory(1)
      if (pages[0]) await api.pushPageToDevice(pages[0].id, device.id)
      addEvent({ type: "system", message: `已推送: ${label}` })
    } catch {
      addEvent({ type: "alert", message: "推送失败" })
    }
  }

  const generateExploration = () => {
    const options = [
      "探索城市中一家从未去过的独立书店，并记录三个吸引你的书名。",
      "选择一个你好奇但从未深入了解的技术主题，花 45 分钟系统性地阅读。",
      "徒步或骑行到城市的一个新区域，不使用导航，只凭直觉前进。",
      "尝试用不同语言（可以是任何编程语言）解决一道经典算法题。",
    ]
    setExploration(options[Math.floor(Math.random() * options.length)])
  }

  const incomePct = Math.round((incomeAchieved / incomeGoal) * 100)

  const MILESTONES = [
    { month: "JUN", day: "28", title: "v2.0 预发布准备", sub: "检查所有关键模块状态", type: "milestone", progress: null },
    { month: "JUL", day: "05", title: "系统架构评审会议", sub: "准备演示幻灯片", type: "task", progress: 33 },
  ]

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-8 max-w-7xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h2 className="font-display font-bold text-primary text-[32px] mb-2">生活中心</h2>
            <p className="text-on-surface-variant text-[16px]">综合监控终端 • 时间 / 收入 / 健康数据流</p>
          </div>
          <button
            onClick={() => pushToDevice("生活总览")}
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary text-[14px] font-medium hover:bg-surface-container transition-colors self-start"
          >
            <span className="material-symbols-outlined text-[18px]">cast</span>
            推送至墨水屏
          </button>
        </div>

        {/* ── SECTION 1: 时间与日程 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Clock Styles (8/12) */}
          <section className="xl:col-span-8 bg-surface-container-lowest border border-outline-variant flex flex-col">
            <header className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface-container-low/50">
              <h3 className="font-mono text-[11px] text-on-surface uppercase tracking-wider">待机时钟样式</h3>
              <button
                onClick={() => pushToDevice(`时钟样式: ${activeClockStyle}`)}
                className="flex items-center gap-1.5 px-3 py-1 bg-primary text-on-primary text-[12px] font-mono hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[14px]">present_to_all</span>
                推送到屏幕
              </button>
            </header>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {CLOCK_STYLES.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveClockStyle(s.id)}
                  className={`border-2 p-3 cursor-pointer relative ${
                    activeClockStyle === s.id
                      ? "border-secondary"
                      : "border-outline-variant hover:border-outline"
                  } transition-colors`}
                >
                  {activeClockStyle === s.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary" />
                  )}
                  <div className="h-24 bg-surface-container-lowest border border-outline-variant flex items-center justify-center mb-2 px-2">
                    {s.preview}
                  </div>
                  <p className={`font-mono text-[13px] text-center ${activeClockStyle === s.id ? "text-primary" : "text-on-surface-variant"}`}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Pomodoro (4/12) */}
          <PomodoroTimer onPush={pushToDevice} />

          {/* Calendar View (7/12) */}
          <section className="xl:col-span-7 bg-surface-container-lowest border border-outline-variant flex flex-col">
            <header className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface-container-low/50">
              <div className="flex items-center gap-4">
                <h3 className="font-mono text-[11px] text-on-surface uppercase tracking-wider">日程与进度</h3>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 border border-secondary text-secondary font-mono text-[10px]">周</span>
                  <span className="px-2 py-0.5 border border-outline-variant text-on-surface-variant font-mono text-[10px] cursor-pointer hover:border-outline transition-colors">月</span>
                </div>
              </div>
              <button className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined text-[18px]">sync</span>
              </button>
            </header>
            <div className="p-0">
              {MILESTONES.map((m) => (
                <div key={m.title} className="flex items-center justify-between p-4 border-b border-outline-variant/50 last:border-0 hover:bg-surface transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-outline-variant flex flex-col items-center justify-center bg-surface-container-low shrink-0">
                      <span className="font-mono text-[10px] text-on-surface-variant">{m.month}</span>
                      <span className="font-mono font-bold text-primary text-[13px]">{m.day}</span>
                    </div>
                    <div>
                      <p className="font-display font-medium text-primary text-[14px]">{m.title}</p>
                      <p className="text-on-surface-variant text-[14px] mt-0.5">{m.sub}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {m.progress !== null ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="w-24 h-1.5 bg-surface-variant overflow-hidden">
                          <div className="bg-secondary-container h-full" style={{ width: `${m.progress}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-on-surface-variant">进度 {m.progress}%</span>
                      </div>
                    ) : (
                      <span className="px-2 py-1 bg-surface-variant text-on-surface font-mono text-[10px]">里程碑</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Countdowns (5/12) */}
          <section className="xl:col-span-5 bg-surface-container-lowest border border-outline-variant flex flex-col">
            <header className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface-container-low/50">
              <h3 className="font-mono text-[11px] text-on-surface uppercase tracking-wider">倒数日</h3>
              <button className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </header>
            <div className="p-6 space-y-4">
              <CountdownItem label="产品发布" days={12} urgency="critical" targetDate="2024-07-08" onPush={() => pushToDevice("产品发布倒计时")} />
              <CountdownItem label="资格认证考试" days={45} urgency="normal" targetDate="2024-08-10" onPush={() => pushToDevice("认证考试倒计时")} />
            </div>
          </section>
        </div>

        {/* ── SECTION 2: 商业与生活 ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Income Tracking (8/12) */}
          <section className="md:col-span-8 bg-surface-container-lowest border border-outline-variant flex flex-col">
            <header className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">收入追踪</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">monitoring</span>
            </header>
            <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 border-r border-outline-variant pr-6">
                <div className="font-mono text-[13px] text-on-surface-variant mb-1">月度目标</div>
                <div className="font-display font-semibold text-primary text-[24px] mb-4">¥ {incomeGoal.toLocaleString()}</div>
                <div className="w-full bg-surface-variant h-2 overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${incomePct}%` }} />
                </div>
                <div className="font-mono text-[13px] text-on-surface-variant mt-2 text-right">{incomePct}% 完成</div>
              </div>
              <div className="col-span-2">
                <div className="font-mono text-[13px] text-on-surface-variant mb-3">活跃潜在客户 &amp; 下一步行动</div>
                <ul className="space-y-3">
                  {[
                    { icon: "contact_mail", color: "text-secondary", label: "TechCorp 基础设施升级", action: "准备 RAG 架构方案提案，周三前发送。" },
                    { icon: "contact_mail", color: "text-primary", label: "LocalCafe 智能温控", action: "等待 IoT 硬件采购确认。" },
                  ].map((lead) => (
                    <li key={lead.label} className="flex items-start gap-3 pb-3 border-b border-outline-variant last:border-0 last:pb-0">
                      <span className={`material-symbols-outlined ${lead.color} text-[20px] mt-1`}>{lead.icon}</span>
                      <div>
                        <div className="font-medium text-primary text-[14px]">{lead.label}</div>
                        <div className="text-on-surface-variant text-[14px]">{lead.action}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Services (4/12) */}
          <section className="md:col-span-4 bg-surface-container-lowest border border-outline-variant flex flex-col">
            <header className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">服务库</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">layers</span>
            </header>
            <div className="p-6 flex-1 flex flex-col gap-4">
              {[
                { icon: "memory", label: "AI Development", status: "ACTIVE" },
                { icon: "dataset", label: "RAG Systems", status: "ACTIVE" },
                { icon: "router", label: "IoT Integrations", status: "STANDBY" },
              ].map((s) => (
                <div key={s.label} className="p-3 border border-outline-variant flex items-center justify-between hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">{s.icon}</span>
                    <span className="font-mono text-[13px] text-primary">{s.label}</span>
                  </div>
                  <span className={`font-mono text-[11px] border px-2 py-1 ${s.status === "ACTIVE" ? "border-secondary text-secondary" : "border-outline-variant text-on-surface-variant"}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Health Metrics (8/12) */}
          <section className="md:col-span-8 bg-surface-container-lowest border border-outline-variant flex flex-col">
            <header className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">健康指标</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">favorite</span>
            </header>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-outline-variant">
              <div className="p-6">
                <div className="font-mono text-[13px] text-on-surface-variant mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">fitness_center</span>运动记录
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-primary text-[14px]">力量训练 (推)</span>
                    <span className="font-mono text-[13px] text-on-surface-variant">45 分钟</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-primary text-[14px]">恢复状态</span>
                    <span className="font-mono text-[13px] text-primary border-b border-primary">良好 (85%)</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-outline-variant">
                    <span className="font-mono text-[11px] text-on-surface-variant">NEXT: 核心 &amp; 有氧 (明日)</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="font-mono text-[13px] text-on-surface-variant mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">restaurant</span>饮食日志
                </div>
                <ul className="space-y-3 text-[14px]">
                  <li className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant">早餐: 燕麦 &amp; 蛋白粉</span>
                    <span className="font-mono text-[13px]">350 kcal</span>
                  </li>
                  <li className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant">午餐: 鸡胸肉沙拉</span>
                    <span className="font-mono text-[13px]">420 kcal</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-error-container text-on-error-container text-[14px] flex items-start gap-2 border border-[#ffb4ab]">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span>营养警报: 今日蛋白质摄入量低于目标值 20g。</span>
                </div>
              </div>
            </div>
          </section>

          {/* Weekend Exploration (4/12) */}
          <section className="md:col-span-4 bg-surface-container-highest border border-outline-variant flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#191c1e 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            <header className="px-6 py-4 border-b border-outline-variant flex justify-between items-center relative z-10">
              <span className="font-mono text-[11px] text-on-surface uppercase tracking-widest">周末探索</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface">explore</span>
            </header>
            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center relative z-10">
              <span className="material-symbols-outlined text-[48px] text-primary mb-4 opacity-50">map</span>
              {exploration ? (
                <p className="text-[14px] text-on-surface leading-relaxed mb-6">{exploration}</p>
              ) : (
                <>
                  <h3 className="font-display font-semibold text-primary text-[20px] mb-2">生成新任务</h3>
                  <p className="text-on-surface-variant text-[14px] mb-6">打破常规，随机生成一个城市探索或深度阅读任务。</p>
                </>
              )}
              <button
                onClick={generateExploration}
                className="bg-primary text-on-primary text-[14px] font-medium py-2 px-6 border border-primary hover:opacity-90 transition-all w-full flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">shuffle</span>
                {exploration ? "重新生成" : "初始化生成器"}
              </button>
              {exploration && (
                <button
                  onClick={() => pushToDevice("周末探索任务")}
                  className="mt-2 w-full py-2 border border-outline text-on-surface text-[14px] hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">send_to_mobile</span>
                  推送到屏幕
                </button>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
