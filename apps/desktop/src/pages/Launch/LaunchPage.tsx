import { useState } from "react"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"

// ── Checklist Item ────────────────────────────────────────────────

function ChecklistItem({
  label,
  note,
  done,
  onToggle,
  onPush,
}: {
  label: string
  note: string
  done: boolean
  onToggle: () => void
  onPush: () => void
}) {
  return (
    <div className="flex items-start gap-3 group">
      <input
        type="checkbox"
        checked={done}
        onChange={onToggle}
        className="mt-1 w-4 h-4 accent-primary cursor-pointer"
      />
      <div className="flex-1">
        <p className={`text-[14px] font-medium text-primary transition-colors group-hover:text-secondary ${done ? "line-through opacity-60" : ""}`}>
          {label}
        </p>
        <p className="font-mono text-[11px] text-on-surface-variant mt-1">{note}</p>
      </div>
      <button
        onClick={onPush}
        className="text-outline hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        title="推送到 E-Ink"
      >
        <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
      </button>
    </div>
  )
}

// ── Version Log Entry ─────────────────────────────────────────────

function VersionEntry({
  version,
  date,
  tag,
  tagColor,
  title,
  desc,
}: {
  version: string
  date: string
  tag: string
  tagColor: string
  title: string
  desc: string
}) {
  return (
    <div className="p-6 border-b border-outline-variant last:border-0 hover:bg-surface-container-lowest transition-colors flex gap-6">
      <div className="w-24 shrink-0">
        <div className="font-mono text-[13px] text-primary font-bold">{version}</div>
        <div className="font-mono text-[11px] text-on-surface-variant mt-1">{date}</div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 border text-[10px] font-mono ${tagColor}`}>{tag}</span>
          <h4 className="text-[14px] font-medium text-primary">{title}</h4>
        </div>
        <p className="text-[14px] text-on-surface-variant">{desc}</p>
      </div>
    </div>
  )
}

// ── Knowledge Card ────────────────────────────────────────────────

function KnowledgeCard({
  category,
  categoryColor,
  title,
  body,
  onPush,
}: {
  category: string
  categoryColor: string
  title: string
  body: string
  onPush: () => void
}) {
  return (
    <div className="border border-outline-variant p-4 bg-surface relative group">
      <button
        onClick={onPush}
        className="absolute top-2 right-2 text-outline hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <span className="material-symbols-outlined text-[16px]">send_to_mobile</span>
      </button>
      <div className={`font-mono text-[11px] mb-2 ${categoryColor}`}>{category}</div>
      <h4 className="font-medium text-primary text-[14px] mb-1">{title}</h4>
      <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed">{body}</p>
    </div>
  )
}

// ── Interview Simulator ───────────────────────────────────────────

function InterviewSimulator({ onPush }: { onPush: () => void }) {
  const [answer, setAnswer] = useState("")
  const [clarity] = useState(85)
  const [depth] = useState(70)

  return (
    <div className="p-6 flex-1 flex flex-col lg:flex-row gap-6">
      {/* Question */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <span className="px-2 py-1 bg-surface-container border border-outline-variant font-mono text-[10px] text-primary">
            System Design
          </span>
        </div>
        <h4 className="font-display font-semibold text-primary text-[20px] mb-4 leading-tight">
          "如何为分布式 API 设计一个限流器？"
        </h4>
        <div className="mt-auto">
          <label className="font-mono text-[11px] text-on-surface-variant block mb-2">
            你的回答框架
          </label>
          <textarea
            className="w-full bg-surface border-0 border-b-2 border-outline-variant focus:border-secondary focus:ring-0 p-2 text-[14px] resize-none h-24 outline-none transition-colors"
            placeholder="在此记录你的核心论点..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>
      </div>
      {/* AI Scoring */}
      <div className="w-full lg:w-64 shrink-0 bg-surface-container-low border border-outline-variant p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[11px] text-primary">AI 评估</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">model_training</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "清晰度", value: clarity, color: "bg-primary" },
              { label: "深度", value: depth, color: "bg-secondary" },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between font-mono text-[10px] mb-1">
                  <span className="text-on-surface-variant">{m.label}</span>
                  <span className="text-primary font-bold">{m.value}%</span>
                </div>
                <div className="w-full bg-surface-variant h-1 overflow-hidden">
                  <div className={`${m.color} h-full`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant mt-4 leading-relaxed border-t border-outline-variant pt-2">
            建议：具体提及 Token Bucket 与 Leaky Bucket 算法，并讨论 Redis 作为分布式锁存储机制。
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 bg-primary text-on-primary py-2 font-mono text-[10px] flex items-center justify-center gap-1 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[14px]">mic</span>
            录制回答
          </button>
          <button
            onClick={onPush}
            className="p-2 border border-outline-variant hover:bg-surface-variant text-on-surface-variant transition-colors"
            title="推送到 E-Ink"
          >
            <span className="material-symbols-outlined text-[16px]">send_to_mobile</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

const INITIAL_CHECKLIST = [
  { label: "更新 README.md", note: "v1.2 文档已合并。", done: true },
  { label: "安全审计", note: "检查依赖漏洞。", done: false },
  { label: "演示视频制作", note: "录制核心工作流循环。", done: false },
]

export function LaunchPage() {
  const [checks, setChecks] = useState(INITIAL_CHECKLIST)
  const device = useDeviceStore((s) => s.device)
  const addEvent = useEventStore((s) => s.addEvent)

  const toggleCheck = (i: number) => {
    setChecks((prev) => prev.map((c, idx) => (idx === i ? { ...c, done: !c.done } : c)))
  }

  const pushToDevice = async (label: string) => {
    if (!device) { addEvent({ type: "alert", message: "设备未绑定" }); return }
    try {
      const pages = await api.getPageHistory(1)
      if (pages[0]) await api.pushPageToDevice(pages[0].id, device.id)
      addEvent({ type: "system", message: `已推送: ${label}` })
    } catch {
      addEvent({ type: "alert", message: "推送失败" })
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-8 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="mb-2">
          <h2 className="font-display font-bold text-primary text-[32px] mb-2">项目执行</h2>
          <p className="text-on-surface-variant text-[16px] max-w-2xl">
            管理发布协议，追踪版本历史，并将学习模块直接推送到电子墨水终端以持续专注。
          </p>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Pre-launch Checklist */}
          <div className="bento-card col-span-1 lg:col-span-4 flex flex-col gap-0 p-0">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-mono text-[11px] text-primary uppercase tracking-widest">发布前检查清单</h3>
              <button
                onClick={() => pushToDevice("发布检查清单")}
                className="text-secondary hover:bg-secondary-container p-1 transition-colors"
                title="推送到 E-Ink"
              >
                <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
              </button>
            </div>
            <div className="p-6 flex-1 space-y-4">
              {checks.map((c, i) => (
                <ChecklistItem
                  key={i}
                  label={c.label}
                  note={c.note}
                  done={c.done}
                  onToggle={() => toggleCheck(i)}
                  onPush={() => pushToDevice(c.label)}
                />
              ))}
            </div>
          </div>

          {/* Version Logs */}
          <div className="bento-card col-span-1 lg:col-span-8 flex flex-col gap-0 p-0">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-mono text-[11px] text-primary uppercase tracking-widest">版本记录</h3>
              <span className="font-mono text-[13px] text-on-surface-variant bg-surface-container px-2 py-1">
                Latest: v1.1.4
              </span>
            </div>
            <div className="flex-1 flex flex-col">
              <VersionEntry
                version="v1.1.4"
                date="今天"
                tag="FIX"
                tagColor="border-outline-variant text-primary"
                title="修复 WebGL 渲染管线内存泄漏"
                desc="解决了未卸载的着色器上下文未被垃圾回收的问题，导致低端设备上的连续帧丢失。"
              />
              <VersionEntry
                version="v1.1.3"
                date="昨天"
                tag="FEATURE"
                tagColor="border-secondary text-secondary bg-secondary-fixed/20"
                title="E-Ink 推送协议集成"
                desc="新增 ESP32 串行通信层，支持直接向外部电子墨水显示模块传输纯文本 JSON 负载。"
              />
              <VersionEntry
                version="v1.1.2"
                date="3天前"
                tag="REFACTOR"
                tagColor="border-outline-variant text-on-surface-variant"
                title="AI Director 优先级引擎重构"
                desc="将调度算法迁移至 P0-P5 优先级体系，支持动态紧急度权重计算。"
              />
            </div>
          </div>

          {/* Learning & Growth Header */}
          <div className="col-span-1 lg:col-span-12 flex items-center justify-between">
            <h2 className="font-display font-semibold text-primary text-[24px]">学习与成长</h2>
            <div className="h-px bg-outline-variant flex-1 mx-4" />
            <button
              onClick={() => pushToDevice("全部学习卡片")}
              className="border border-outline text-primary font-mono text-[11px] px-4 py-2 flex items-center gap-2 hover:bg-surface-variant transition-colors uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              全部同步到显示器
            </button>
          </div>

          {/* Knowledge Stream */}
          <div className="bento-card col-span-1 lg:col-span-4 flex flex-col gap-0 p-0">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-mono text-[11px] text-primary uppercase tracking-widest">知识流</h3>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">school</span>
            </div>
            <div className="p-4 space-y-4">
              <KnowledgeCard
                category="C++ Core Guidelines"
                categoryColor="text-secondary"
                title="RAII 原则"
                body="Resource Acquisition Is Initialization。将资源的生命周期与本地对象的生命周期绑定。"
                onPush={() => pushToDevice("RAII 原则")}
              />
              <KnowledgeCard
                category="Linux Sysadmin"
                categoryColor="text-primary"
                title="`strace` 命令"
                body="追踪系统调用和信号。适用于调试挂起或静默失败的程序。"
                onPush={() => pushToDevice("strace 命令")}
              />
            </div>
          </div>

          {/* Interview Simulator */}
          <div className="bento-card col-span-1 lg:col-span-8 flex flex-col gap-0 p-0">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-mono text-[11px] text-primary uppercase tracking-widest">面试模拟器</h3>
              <div className="flex gap-2">
                <button className="p-1 border border-outline-variant hover:bg-surface-variant text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button className="p-1 border border-outline-variant hover:bg-surface-variant text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
            <InterviewSimulator onPush={() => pushToDevice("面试题")} />
          </div>

        </div>
      </div>
    </div>
  )
}
