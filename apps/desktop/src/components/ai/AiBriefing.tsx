import { usePageStore } from "#/stores/pageStore"
import { useEventStore } from "#/stores/eventStore"
import { Check, X } from "lucide-react"

const templateLabels: Record<string, string> = {
  QUEST_SCROLL: "任务卷轴", TERMINAL_STATUS: "数据看板", LAUNCH_PANEL: "发射台",
  SYSTEM_ALERT: "系统告警", POSTCARD: "电子明信片", RELEASE_NEWS: "发布战报",
}

const priorityBadge: Record<number, string> = {
  0: "badge-red", 1: "badge-amber", 2: "badge-blue", 3: "badge-purple", 4: "badge-slate", 5: "badge-slate",
}

export function AiBriefing() {
  const recommendation = usePageStore((s) => s.aiRecommendation)
  const addEvent = useEventStore((s) => s.addEvent)

  if (!recommendation || !recommendation.candidatePages?.length) {
    return <div className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>暂无候选页面，去 AI 任务或监控告警创建第一个页面。</div>
  }

  return (
    <div className="space-y-3 text-[13px]">
      <div className="flex items-center gap-2">
        <span className={`badge ${priorityBadge[recommendation.priority] ?? "badge-slate"}`}>P{recommendation.priority}</span>
        <span style={{ fontWeight: 500, color: "var(--color-text)" }}>
          {templateLabels[recommendation.templateId] ?? recommendation.pageType}
        </span>
      </div>
      <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        {recommendation.reason}
      </p>
      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        {recommendation.candidatePages.length} 个候选页面
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => addEvent({ type: "system", message: "已接受 AI 推荐" })} className="btn btn-primary flex-1" style={{ padding: "6px 10px", fontSize: 12 }}>
          <Check size={12} />接受
        </button>
        <button onClick={() => addEvent({ type: "system", message: "已忽略 AI 推荐" })} className="btn btn-secondary flex-1" style={{ padding: "6px 10px", fontSize: 12 }}>
          <X size={12} />忽略
        </button>
      </div>
    </div>
  )
}
