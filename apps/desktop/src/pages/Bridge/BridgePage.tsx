import { usePageStore } from "#/stores/pageStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import { Layers, FileText, Clock, Send } from "lucide-react"

const templateLabel: Record<string, string> = {
  QUEST_SCROLL: "任务卷轴", TERMINAL_STATUS: "数据看板", LAUNCH_PANEL: "发射台",
  SYSTEM_ALERT: "系统告警", POSTCARD: "明信片", RELEASE_NEWS: "战报",
}

export function BridgePage() {
  const currentPage = usePageStore((s) => s.currentPage)
  const candidates = usePageStore((s) => s.candidatePages)
  const pageHistory = usePageStore((s) => s.pageHistory)
  const recommendation = usePageStore((s) => s.aiRecommendation)
  const isOnline = useDeviceStore((s) => s.isOnline)
  const events = useEventStore((s) => s.events)

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        {/* Page title and description */}
        <div className="flex flex-col gap-1 border-b border-ink-100 pb-4">
          <h1 className="text-xs font-mono font-bold tracking-widest text-ink-700 uppercase">
            // 仪表盘主控制台
          </h1>
          <p className="text-[11px] text-ink-400 font-sans">
            AI 屏幕调度员，负责协调页面切换、队列优先级和硬件同步日志。
          </p>
        </div>

        {/* Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: AI Director Recommendation & Candidate Queue */}
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50">
                <span className="relative flex size-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple opacity-75" />
                  <span className="relative inline-flex rounded-full size-1.5 bg-purple" />
                </span>
                AI 屏幕调度员协调中心
              </div>
              <div className="p-5 space-y-5">
                {recommendation ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center h-5 px-2 text-[10px] font-mono font-bold rounded bg-purple/15 text-purple border border-purple/30">
                        系统推荐 // 优先级 P{recommendation.priority}
                      </span>
                      <span className="text-xs font-bold text-ink-700 uppercase font-mono">
                        {templateLabel[recommendation.templateId] ?? recommendation.pageType} ({recommendation.templateId})
                      </span>
                    </div>
                    <div className="p-4 bg-ink-50 border border-ink-100 rounded-md font-sans text-xs text-ink-600 leading-relaxed">
                      <div className="font-mono text-[10px] font-bold text-ink-400 mb-1 uppercase tracking-wider">AI 推荐原因:</div>
                      {recommendation.reason}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-ink-300 font-mono uppercase">
                    当前无系统推荐页面
                  </div>
                )}

                {/* Candidate Queue list */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-wider">
                    待播放页面队列 ({candidates.length} 帧)
                  </div>
                  {candidates.length === 0 ? (
                    <div className="p-4 bg-ink-50/30 border border-dashed border-ink-150 rounded text-center text-[11px] text-ink-300 font-mono uppercase">
                      队列中无待播放页面
                    </div>
                  ) : (
                    <div className="divide-y divide-rose-100/5 border border-ink-150 rounded overflow-hidden">
                      {candidates.map((c, idx) => (
                        <div key={c.id || idx} className="flex justify-between items-center p-3 text-xs bg-ink-50/20 hover:bg-ink-50/50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-mono text-ink-400">#{(idx + 1).toString().padStart(2, "0")}</span>
                            <span className="font-mono font-bold text-ink-700">{templateLabel[c.templateId] ?? c.templateId}</span>
                            {c.priority !== undefined && (
                              <span className="text-[9px] font-mono px-1 rounded bg-ink-100 text-ink-400">P{c.priority}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-ink-300">
                            {c.reason || "自动触发"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: System Stats */}
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50">
                <Layers size={13} className="text-accent" />
                系统运行指标与页面数
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Stat icon={Layers} label="队列候选项" value={candidates.length} />
                <Stat icon={Clock} label="设备连接状态" value={isOnline ? "在线" : "离线"} color={isOnline ? "text-success" : "text-ink-400"} />
                <Stat icon={Send} label="活跃页面数" value={currentPage ? "1" : "0"} />
                <Stat icon={FileText} label="历史归档帧" value={pageHistory.length} />
              </div>
            </div>
          </div>

          {/* Right Area */}
          <div className="space-y-6 flex flex-col">
            {/* Card 3: Real-Time Event Log */}
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col h-[522px]">
              <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50">
                <div className="size-2 rounded-full bg-accent animate-pulse" />
                事件与系统命令日志
              </div>
              <div className="overflow-y-auto divide-y divide-ink-100/50 flex-1">
                {events.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-ink-300 uppercase">日志无输出</div>
                ) : (
                  events.map((e) => (
                    <div key={e.id} className="flex items-start gap-2.5 px-4 py-3 text-xs hover:bg-ink-50/30 transition-colors duration-150">
                      <span className="shrink-0 mt-0.5 text-[10px]">
                        {e.type === "alert" ? (
                          <span className="text-danger">▲</span>
                        ) : e.type === "quest" ? (
                          <span className="text-purple">◆</span>
                        ) : (
                          <span className="text-accent">●</span>
                        )}
                      </span>
                      <span className="flex-1 text-ink-500 font-sans break-all">{e.message}</span>
                      <span className="text-[10px] shrink-0 font-mono tabular-nums text-ink-300">
                        {e.timestamp?.slice(11, 19) ?? ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof Layers; label: string; value: number | string; color?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded bg-ink-50 border border-ink-100 hover:border-ink-200 transition-colors duration-200">
      <div className="size-8 rounded flex items-center justify-center shrink-0 bg-ink-100/80">
        <Icon size={14} className="text-ink-400" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-mono tracking-wider text-ink-400 font-bold leading-tight uppercase">{label}</div>
        <div className={`text-base font-bold font-mono tracking-wide tabular-nums mt-0.5 leading-tight ${color ?? "text-ink-700"}`}>
          {value}
        </div>
      </div>
    </div>
  )
}
