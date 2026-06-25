import { useState } from "react"
import { usePageStore } from "#/stores/pageStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import { EInkPreview } from "#/components/eink/EInkPreview"
import * as api from "#/lib/api"

export function DevicePanel() {
  const currentPage = usePageStore((s) => s.currentPage)
  const setCurrentPage = usePageStore((s) => s.setCurrentPage)
  const setCandidates = usePageStore((s) => s.setCandidates)
  const setRecommendation = usePageStore((s) => s.setRecommendation)

  const isOnline = useDeviceStore((s) => s.isOnline)
  const device = useDeviceStore((s) => s.device)
  const lastRefreshAt = useDeviceStore((s) => s.lastRefreshAt)
  const addEvent = useEventStore((s) => s.addEvent)

  const [pushing, setPushing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const devs = await api.discoverDevices()
      if (devs.length > 0) {
        useDeviceStore.getState().setDevice(devs[0])
        useDeviceStore.getState().setOnline(devs[0].status === "online")
      } else {
        useDeviceStore.getState().setOnline(false)
      }
      const p = await api.getCurrentPage()
      if (p) setCurrentPage(p)
      const r = await api.getDisplayRecommendation()
      setRecommendation(r)
      const c = await api.getCandidatePages()
      setCandidates(c)
      addEvent({ type: "system", message: "同步设备与最新页面数据成功" })
    } catch (e) {
      addEvent({ type: "alert", message: `数据刷新失败: ${e}` })
    } finally {
      setRefreshing(false)
    }
  }

  const handlePush = async () => {
    if (!currentPage || !device) return
    setPushing(true)
    try {
      await api.pushPageToDevice(currentPage.id, device.id)
      useDeviceStore.getState().setLastRefresh(new Date())
      addEvent({ type: "system", message: `已向设备推送 ${currentPage.templateId}` })
    } catch {
      addEvent({ type: "alert", message: "向设备推送页面失败" })
    } finally {
      setPushing(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-[400px] bg-surface-container-low border-l border-outline-variant shrink-0 select-none overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 h-12 px-5 border-b border-outline-variant shrink-0 bg-surface">
        <span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>settings_remote</span>
        <span className="font-mono text-[13px] font-semibold text-primary uppercase tracking-wider">
          设备控制面板
        </span>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center px-6 py-6 border-b border-outline-variant">
        <EInkPreview page={currentPage} />
      </div>

      {/* Actions */}
      <div className="p-5 grid grid-cols-2 gap-3 border-b border-outline-variant">
        <button
          onClick={handlePush}
          disabled={!isOnline || !currentPage || pushing}
          className="flex items-center justify-center gap-2 h-10 text-[13px] font-mono bg-primary text-on-primary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          <span className={`material-symbols-outlined text-[16px] ${pushing ? "animate-pulse" : ""}`}>send_to_mobile</span>
          {pushing ? "推送中..." : "推送至屏幕"}
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 h-10 text-[13px] font-mono border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[16px] ${refreshing ? "animate-spin" : ""}`}>refresh</span>
          {refreshing ? "同步中..." : "同步设备"}
        </button>
      </div>

      {/* Device Info */}
      <div className="p-5 space-y-4">
        <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider pb-2 border-b border-outline-variant">
          硬件诊断信息
        </p>
        {[
          { label: "节点名称", value: device?.name ?? "NODE-01" },
          { label: "IP 地址", value: device?.ip ?? "127.0.0.1" },
          { label: "屏幕规格", value: device?.model ?? '4.2" (400×300)' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-on-surface-variant text-[14px]">{row.label}</span>
            <span className="font-mono text-[13px] text-primary">{row.value}</span>
          </div>
        ))}

        {/* Status */}
        <div className="flex justify-between items-center">
          <span className="text-on-surface-variant text-[14px]">连接状态</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-secondary" : "bg-outline"}`} />
            <span className={`font-mono text-[13px] ${isOnline ? "text-secondary font-semibold" : "text-outline"}`}>
              {isOnline ? "在线" : "离线"}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-outline-variant">
          <span className="text-on-surface-variant text-[14px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            最后同步
          </span>
          <span className="font-mono text-[13px] text-primary">
            {lastRefreshAt
              ? lastRefreshAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
              : "从未"}
          </span>
        </div>
      </div>
    </div>
  )
}
