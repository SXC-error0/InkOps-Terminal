import { useState } from "react"
import { EInkPreview } from "#/components/eink/EInkPreview"
import { AiBriefing } from "#/components/ai/AiBriefing"
import { EventStream } from "#/components/layout/EventStream"
import { usePageStore } from "#/stores/pageStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import { Send, RefreshCw, Pin } from "lucide-react"
import * as api from "#/lib/api"

export function BridgePage() {
  const currentPage = usePageStore((s) => s.currentPage)
  const isOnline = useDeviceStore((s) => s.isOnline)
  const device = useDeviceStore((s) => s.device)
  const addEvent = useEventStore((s) => s.addEvent)
  const setCurrentPage = usePageStore((s) => s.setCurrentPage)
  const setRecommendation = usePageStore((s) => s.setRecommendation)
  const [pushing, setPushing] = useState(false)

  const handlePush = async () => {
    if (!currentPage || !device) return
    setPushing(true)
    try {
      await api.pushPageToDevice(currentPage.id, device.id)
      addEvent({ type: "system", message: `页面已推送: ${currentPage.templateId}` })
    } catch {
      addEvent({ type: "alert", message: "推送失败" })
    } finally {
      setPushing(false)
    }
  }

  const handleRefresh = async () => {
    try {
      const devices = await api.discoverDevices()
      if (devices.length > 0) {
        useDeviceStore.getState().setDevice(devices[0])
        useDeviceStore.getState().setOnline(devices[0].status === "online")
      }
      const page = await api.getCurrentPage()
      if (page) setCurrentPage(page)
      const rec = await api.getDisplayRecommendation()
      setRecommendation(rec)
      addEvent({ type: "system", message: "状态已刷新" })
    } catch {
      addEvent({ type: "system", message: "刷新失败" })
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-5">
        {/* 顶部指标卡片行 */}
        <div className="grid grid-cols-4 gap-3">
          <div className="card card-body flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#eff6ff" }}>
              <Send size={14} style={{ color: "var(--color-accent)" }} />
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>候选页面</div>
              <div className="text-lg font-semibold" style={{ color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
                {usePageStore.getState().candidatePages.length}
              </div>
            </div>
          </div>
          <div className="card card-body flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#f0fdf4" }}>
              <div className="status-dot online" style={{ width: 10, height: 10 }} />
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>设备状态</div>
              <div className="text-lg font-semibold" style={{ color: isOnline ? "var(--color-success)" : "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                {isOnline ? "在线" : "离线"}
              </div>
            </div>
          </div>
          <div className="card card-body flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#f5f3ff" }}>
              <RefreshCw size={14} style={{ color: "var(--color-purple)" }} />
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>已推送</div>
              <div className="text-lg font-semibold" style={{ color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
                {currentPage ? "1" : "0"}
              </div>
            </div>
          </div>
          <div className="card card-body flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#fffbeb" }}>
              <Pin size={14} style={{ color: "var(--color-warning)" }} />
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>页面历史</div>
              <div className="text-lg font-semibold" style={{ color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
                {usePageStore.getState().pageHistory.length}
              </div>
            </div>
          </div>
        </div>

        {/* 主区域: 预览 + 面板 */}
        <div className="grid grid-cols-3 gap-5">
          {/* 左: E-Ink 预览 (占 2/3) */}
          <div className="col-span-2 card flex flex-col items-center py-8">
            <EInkPreview page={currentPage} />
            <div className="flex items-center gap-2 mt-5">
              <button onClick={handlePush} disabled={!isOnline || !currentPage || pushing} className="btn btn-primary">
                <Send size={14} />
                {pushing ? "推送中..." : "推送到设备"}
              </button>
              <button onClick={handleRefresh} className="btn btn-secondary">
                <RefreshCw size={14} />
                刷新
              </button>
              <button className="btn btn-secondary">
                <Pin size={14} />
                固定
              </button>
            </div>
          </div>

          {/* 右: AI 简报 + 事件流 */}
          <div className="space-y-4">
            <div className="card">
              <div className="card-header">AI 推荐</div>
              <div className="card-body">
                <AiBriefing />
              </div>
            </div>
            <div className="card" style={{ maxHeight: 280 }}>
              <div className="card-header">事件流</div>
              <div className="card-body" style={{ padding: 0 }}>
                <EventStream />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
