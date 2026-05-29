import { useState } from "react"
import { EInkPreview } from "#/components/eink/EInkPreview"
import { usePageStore } from "#/stores/pageStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import { Send, RefreshCw, Pin, Layers, FileText, Clock } from "lucide-react"
import * as api from "#/lib/api"

const templateLabel: Record<string, string> = {
  QUEST_SCROLL: "任务卷轴", TERMINAL_STATUS: "数据看板", LAUNCH_PANEL: "发射台",
  SYSTEM_ALERT: "告警", POSTCARD: "明信片", RELEASE_NEWS: "战报",
}

export function BridgePage() {
  const currentPage = usePageStore((s) => s.currentPage)
  const candidates = usePageStore((s) => s.candidatePages)
  const pageHistory = usePageStore((s) => s.pageHistory)
  const recommendation = usePageStore((s) => s.aiRecommendation)
  const isOnline = useDeviceStore((s) => s.isOnline)
  const device = useDeviceStore((s) => s.device)
  const events = useEventStore((s) => s.events)
  const addEvent = useEventStore((s) => s.addEvent)
  const setCurrentPage = usePageStore((s) => s.setCurrentPage)
  const setRecommendation = usePageStore((s) => s.setRecommendation)
  const [pushing, setPushing] = useState(false)

  const refresh = async () => {
    try {
      const devs = await api.discoverDevices()
      if (devs.length > 0) { useDeviceStore.getState().setDevice(devs[0]); useDeviceStore.getState().setOnline(devs[0].status === "online") }
      const p = await api.getCurrentPage(); if (p) setCurrentPage(p)
      const r = await api.getDisplayRecommendation(); setRecommendation(r)
    } catch { /* */ }
  }

  const push = async () => {
    if (!currentPage || !device) return; setPushing(true)
    try { await api.pushPageToDevice(currentPage.id, device.id); addEvent({ type: "system", message: `已推送 ${currentPage.templateId}` }) }
    catch { addEvent({ type: "alert", message: "推送失败" }) }
    finally { setPushing(false) }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* E-Ink Hero */}
        <div className="flex flex-col items-center py-10">
          <EInkPreview page={currentPage} />
          <div className="flex items-center gap-2 mt-6">
            <button onClick={push} disabled={!isOnline || !currentPage || pushing}
              className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 text-sm font-medium rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-150">
              <Send size={14} />{pushing ? "推送中..." : "推送到设备"}
            </button>
            <button onClick={refresh}
              className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 text-sm font-medium rounded cursor-pointer select-none bg-white text-ink-500 border border-ink-200 hover:bg-ink-50 hover:text-ink-600 hover:border-ink-300 transition-colors duration-150">
              <RefreshCw size={14} />刷新
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 text-sm font-medium rounded cursor-pointer select-none bg-white text-ink-500 border border-ink-200 hover:bg-ink-50 hover:text-ink-600 hover:border-ink-300 transition-colors duration-150">
              <Pin size={14} />固定
            </button>
          </div>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-3 gap-5">
          {/* Stats */}
          <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
            <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none">统计</div>
            <div className="p-5 space-y-3">
              <Stat icon={Layers} label="候选页面" value={candidates.length} />
              <Stat icon={Clock} label="设备状态" value={isOnline ? "在线" : "离线"} color={isOnline ? "text-success" : "text-ink-400"} />
              <Stat icon={Send} label="已推送" value={currentPage ? "1" : "0"} />
              <Stat icon={FileText} label="历史记录" value={pageHistory.length} />
            </div>
          </div>

          {/* AI Recommend */}
          <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
            <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none">AI 推荐</div>
            <div className="p-5">
              {recommendation?.candidatePages?.length ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium rounded whitespace-nowrap bg-accent-light text-accent-strong">P{recommendation.priority}</span>
                    <span className="text-sm font-medium text-ink-600">{templateLabel[recommendation.templateId] ?? recommendation.pageType}</span>
                  </div>
                  <p className="text-xs text-ink-500 leading-relaxed">{recommendation.reason}</p>
                  <p className="text-[11px] text-ink-400">{recommendation.candidatePages.length} 个候选页面</p>
                </div>
              ) : (
                <p className="text-sm text-ink-400">暂无推荐，去 AI 任务生成第一个页面。</p>
              )}
            </div>
          </div>

          {/* Events */}
          <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
            <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none">事件</div>
            <div className="overflow-auto max-h-[220px]">
              {events.length === 0 ? (
                <div className="py-10 text-center text-xs text-ink-400">暂无事件</div>
              ) : events.slice(0, 12).map((e) => (
                <div key={e.id} className="flex items-start gap-2.5 px-4 py-2 text-xs border-b border-ink-50 last:border-0 animate-fade-in">
                  <span className="shrink-0 mt-0.5 text-ink-400">{e.type === "alert" ? "▲" : e.type === "quest" ? "◆" : "●"}</span>
                  <span className="flex-1 truncate text-ink-500">{e.message}</span>
                  <span className="text-[10px] shrink-0 font-mono tabular-nums text-ink-300">{e.timestamp?.slice(11, 16) ?? ""}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof Layers; label: string; value: number | string; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-ink-50"><Icon size={15} className="text-ink-500" /></div>
      <div className="min-w-0">
        <div className="text-[11px] text-ink-400 leading-tight">{label}</div>
        <div className={`text-lg font-semibold font-mono tabular-nums leading-tight ${color ?? "text-ink-700"}`}>{value}</div>
      </div>
    </div>
  )
}
