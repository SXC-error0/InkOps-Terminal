import { useState } from "react"
import { usePageStore } from "#/stores/pageStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import { EInkPreview } from "#/components/eink/EInkPreview"
import * as api from "#/lib/api"
import { Send, RefreshCw, Cpu, Wifi, Clock, Activity } from "lucide-react"

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
      if (p) {
        setCurrentPage(p)
      }
      
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
    <div className="flex flex-col h-full w-[440px] bg-sidebar-bg border-l border-sidebar-border relative z-10 shrink-0 select-none overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 h-12 px-5 border-b border-sidebar-border shrink-0">
        <Cpu size={15} className="text-accent" />
        <span className="text-xs font-bold tracking-wider text-sidebar-text-active font-mono uppercase">
          设备控制面板
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 flex flex-col items-center">
        {/* Physical Case Preview */}
        <div className="flex flex-col items-center relative py-2">
          <EInkPreview page={currentPage} />
        </div>

        {/* Global Action Bar */}
        <div className="w-full grid grid-cols-2 gap-3.5 mt-2">
          <button
            onClick={handlePush}
            disabled={!isOnline || !currentPage || pushing}
            className="flex items-center justify-center gap-2 h-10 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-95"
          >
            <Send size={13} className={pushing ? "animate-pulse" : ""} />
            {pushing ? "推送中..." : "推送至屏幕"}
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 h-10 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-ink-50 text-ink-600 border border-ink-200 hover:bg-ink-150 hover:border-accent/40 transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "同步中..." : "同步设备"}
          </button>
        </div>

        {/* Device Info Card */}
        <div className="w-full cyber-card rounded-lg overflow-hidden flex flex-col mt-2">
          <div className="flex items-center gap-2 h-9 px-4 border-b border-ink-100 text-[10px] font-mono tracking-wider font-bold text-ink-400 uppercase bg-ink-50/50">
            <Activity size={11} className="text-accent" />
            硬件诊断信息
          </div>
          <div className="p-4 space-y-3 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-ink-400">节点名称</span>
              <span className="text-ink-700 font-bold">{device?.name || "NODE-01"}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-ink-400">连接状态</span>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block size-1.5 rounded-full ${isOnline ? "bg-success animate-pulse" : "bg-ink-300"}`} />
                <span className={isOnline ? "text-success font-bold" : "text-ink-300"}>
                  {isOnline ? "在线" : "离线"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink-400">IP 地址</span>
              <span className="text-ink-600 flex items-center gap-1">
                <Wifi size={11} className="opacity-70" />
                {device?.ip || "127.0.0.1"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink-400">屏幕分辨率</span>
              <span className="text-ink-600">{device?.model || "4.2\" (400x300 像素)"}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-ink-100/40">
              <span className="text-ink-400 flex items-center gap-1">
                <Clock size={11} className="opacity-70" />
                最后同步时间
              </span>
              <span className="text-ink-600 tabular-nums">
                {lastRefreshAt ? lastRefreshAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "从未"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
