import { useState, useEffect } from "react"
import { useEventStore } from "#/stores/eventStore"
import { useDeviceStore } from "#/stores/deviceStore"
import * as api from "#/lib/api"
import type { Page, TimelineEvent } from "#/lib/types"

// ── Helpers ───────────────────────────────────────────────────────

function fmtTime(iso?: string | null) {
  if (!iso) return "--:--:--"
  const d = new Date(iso)
  return d.toTimeString().slice(0, 8)
}

const EVENT_TYPE_CONFIG: Record<string, { tag: string; icon: string; color: string; tagColor: string }> = {
  commit: { tag: "GIT",   icon: "code",         color: "text-primary",    tagColor: "text-on-surface-variant border-outline-variant" },
  quest:  { tag: "AI",    icon: "auto_awesome",  color: "text-secondary",  tagColor: "text-secondary border-secondary" },
  alert:  { tag: "ERROR", icon: "error",         color: "text-error",      tagColor: "text-error border-error" },
  launch: { tag: "TASK",  icon: "assignment",    color: "text-primary",    tagColor: "text-on-surface-variant border-outline-variant" },
  message:{ tag: "MSG",   icon: "forum",         color: "text-primary",    tagColor: "text-on-surface-variant border-outline-variant" },
  system: { tag: "SYS",   icon: "terminal",      color: "text-outline",    tagColor: "text-outline border-outline-variant" },
}

// ── Activity Bar Chart ────────────────────────────────────────────

const HOUR_BARS = [
  { label: "08", pct: 30, type: "normal" },
  { label: "09", pct: 80, type: "normal" },
  { label: "10", pct: 100, type: "error" },
  { label: "11", pct: 50, type: "normal" },
  { label: "14", pct: 90, type: "ai" },
  { label: "16", pct: 40, type: "normal" },
]

function ActivityChart({ events }: { events: TimelineEvent[] }) {
  const total = events.length
  const errors = events.filter((e) => e.type === "alert").length
  const aiEvents = events.filter((e) => e.type === "quest").length
  const aiPct = total > 0 ? Math.round((aiEvents / total) * 100) : 0

  return (
    <section className="bento-card">
      <div className="bento-header">
        <span className="bento-label">活动密度</span>
      </div>
      <div className="flex items-end justify-between gap-1 h-20">
        {HOUR_BARS.map((bar) => (
          <div key={bar.label} className="flex-1 bg-surface-variant relative h-full">
            <div
              className={`absolute bottom-0 left-0 right-0 transition-all ${
                bar.type === "error"
                  ? "bg-error-container border-t border-error"
                  : bar.type === "ai"
                  ? "bg-secondary-fixed border-t border-secondary"
                  : "bg-primary-fixed-dim"
              }`}
              style={{ height: `${bar.pct}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 font-mono text-[10px] text-on-surface-variant">
        <span>08:00</span>
        <span>16:00</span>
      </div>
      <div className="mt-3 space-y-2 pt-3 border-t border-outline-variant">
        {[
          { label: "总事件数", value: total, color: "text-primary" },
          { label: "错误警告", value: errors, color: "text-error" },
          { label: "AI 参与度", value: `${aiPct}%`, color: "text-secondary" },
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-center pb-1.5 border-b border-outline-variant last:border-0">
            <span className="text-[13px] text-on-surface-variant">{row.label}</span>
            <span className={`font-mono text-[13px] font-bold ${row.color}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export function StudioPage() {
  const events = useEventStore((s) => s.events)
  const device = useDeviceStore((s) => s.device)
  const isOnline = useDeviceStore((s) => s.isOnline)
  const [pages, setPages] = useState<Page[]>([])
  const [filter, setFilter] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    api.getPageHistory(30).then(setPages).catch(() => {})
  }, [])

  const handlePush = async (pageId: string) => {
    if (!device) return
    setActionLoading(pageId)
    try {
      await api.pushPageToDevice(pageId, device.id)
    } catch { /* ignored */ } finally {
      setActionLoading(null)
    }
  }

  // Combine real events + page history as timeline items
  const timelineEvents = [
    ...events.map((e) => ({
      id: e.id,
      type: e.type,
      message: e.message,
      timestamp: e.timestamp,
      pageId: null as string | null,
    })),
    ...pages.map((p) => ({
      id: p.id,
      type: "commit" as const,
      message: `页面帧: ${p.templateId}`,
      timestamp: p.createdAt,
      pageId: p.id,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter((e) =>
      !filter ||
      e.message.toLowerCase().includes(filter.toLowerCase()) ||
      e.type.includes(filter.toLowerCase())
    )

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row gap-8">

          {/* Left: Timeline (2/3) */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Header + Filter */}
            <section className="bento-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="font-display font-bold text-primary text-xl">时间线</h1>
                  <p className="text-[13px] text-on-surface-variant mt-0.5">
                    {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })} — 系统运行历史
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 16 }}>search</span>
                    <input
                      className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border-b-2 border-outline-variant focus:border-secondary font-mono text-[13px] text-primary outline-none transition-colors"
                      placeholder="过滤事件类型..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  <button className="p-1.5 border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>filter_list</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Timeline Events */}
            <section className="bento-card">
              <p className="bento-label mb-4 pb-4 border-b border-outline-variant">事件流</p>
              <div className="flex flex-col relative py-2">
                {timelineEvents.length === 0 ? (
                  <div className="py-12 text-center">
                    <span className="material-symbols-outlined text-outline" style={{ fontSize: 32 }}>timeline</span>
                    <p className="font-mono text-[11px] text-outline mt-3 uppercase tracking-wider">暂无事件记录</p>
                  </div>
                ) : (
                  timelineEvents.slice(0, 30).map((evt, i) => {
                    const cfg = EVENT_TYPE_CONFIG[evt.type] ?? EVENT_TYPE_CONFIG.system
                    const isLast = i === timelineEvents.slice(0, 30).length - 1
                    return (
                      <div key={evt.id} className="flex gap-4 relative pb-6">
                        {/* Connecting line */}
                        {!isLast && (
                          <div className="absolute left-5 top-10 bottom-0 w-px bg-outline-variant z-0" />
                        )}
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 bg-surface z-10 ${
                            evt.type === "alert"
                              ? "border-error bg-error-container"
                              : "border-outline-variant"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined ${cfg.color}`}
                            style={{ fontSize: 18 }}
                          >
                            {cfg.icon}
                          </span>
                        </div>
                        {/* Content */}
                        <div className="flex-1 pt-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className={`font-mono text-[11px] ${evt.type === "alert" ? "text-error" : "text-on-surface-variant"}`}>
                              {fmtTime(evt.timestamp)}
                            </span>
                            <span className={`font-mono text-[10px] px-2 py-0.5 border ${cfg.tagColor}`}>
                              {cfg.tag}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-[14px] font-medium ${evt.type === "alert" ? "text-error" : "text-primary"} leading-snug`}>
                              {evt.message}
                            </p>
                            {evt.pageId && isOnline && (
                              <button
                                onClick={() => handlePush(evt.pageId!)}
                                disabled={actionLoading === evt.pageId}
                                className="shrink-0 bg-secondary-container text-on-secondary-container text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1 hover:opacity-90 disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>send_to_mobile</span>
                                推送到屏幕
                              </button>
                            )}
                          </div>
                          {evt.type === "commit" && (
                            <div className="font-mono text-[12px] text-on-surface-variant bg-surface-container-low p-2 border border-outline-variant mt-2">
                              <span className="text-secondary">feat:</span> {evt.message}
                            </div>
                          )}
                          {evt.type === "alert" && (
                            <div className="font-mono text-[12px] text-on-surface-variant bg-surface-container-low p-2 border border-error-container mt-2">
                              [WARN] 检测到异常事件，请检查系统状态
                            </div>
                          )}
                          {evt.type === "message" && (
                            <div className="font-sans text-[13px] text-on-surface-variant bg-surface p-2 border border-outline-variant mt-2 italic">
                              "{evt.message}"
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          </div>

          {/* Right: Memory Summary + Activity (1/3) */}
          <div className="xl:w-80 shrink-0 flex flex-col gap-6">
            {/* Memory Summary */}
            <section className="bento-card relative overflow-hidden sticky top-0">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle at 100% 0%, #0058be 0%, transparent 50%)" }}
              />
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-outline-variant relative z-10">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>memory</span>
                <span className="bento-label">记忆摘要</span>
              </div>
              <div className="relative z-10">
                <h2 className="font-display font-bold text-primary text-xl mb-2">每日简报</h2>
                <p className="text-[13px] text-on-surface-variant leading-relaxed mb-5">
                  根据今日的事件日志，系统共记录{" "}
                  <span className="font-medium text-primary">{events.length}</span> 条事件。
                  AI 处理了所有计划中的内容。整体效率评级：
                  <span className="font-medium text-primary ml-1">
                    {events.filter((e) => e.type === "alert").length === 0 ? "A" : "B+"}
                  </span>。
                </p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: "总事件数", value: events.length, color: "text-primary" },
                    { label: "错误警告", value: events.filter((e) => e.type === "alert").length, color: "text-error" },
                    { label: "归档页面", value: pages.length, color: "text-secondary" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center pb-2 border-b border-outline-variant last:border-0">
                      <span className="text-[13px] text-on-surface-variant">{row.label}</span>
                      <span className={`font-mono text-[13px] font-bold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-2">
                  <button className="w-full py-2 border border-outline-variant text-primary font-mono text-[11px] uppercase tracking-wider hover:bg-surface-variant transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
                    导出报告
                  </button>
                  <button
                    disabled={!isOnline}
                    className="w-full py-2 bg-secondary-container text-on-secondary-container font-mono text-[11px] uppercase tracking-wider hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>send_to_mobile</span>
                    推送到屏幕
                  </button>
                </div>
              </div>
            </section>

            {/* Activity Density */}
            <ActivityChart events={events} />
          </div>

        </div>
      </div>
    </div>
  )
}
