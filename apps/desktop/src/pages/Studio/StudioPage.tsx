import { useState, useEffect } from "react"
import { Archive, RefreshCw, Send, FileText } from "lucide-react"
import { useEventStore } from "#/stores/eventStore"
import { useDeviceStore } from "#/stores/deviceStore"
import * as api from "#/lib/api"
import type { Page } from "#/lib/types"

const templateLabel: Record<string, string> = {
  QUEST_SCROLL: "任务卷轴", TERMINAL_STATUS: "数据看板", LAUNCH_PANEL: "发射台",
  SYSTEM_ALERT: "系统告警", POSTCARD: "明信片", RELEASE_NEWS: "战报",
}

export function StudioPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  const addEvent = useEventStore((s) => s.addEvent)
  const isOnline = useDeviceStore((s) => s.isOnline)
  const device = useDeviceStore((s) => s.device)

  const load = async () => {
    setLoading(true)
    try {
      const p = await api.getPageHistory(50)
      setPages(p)
      if (p.length > 0 && !selectedPage) {
        setSelectedPage(p[0])
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const badge = (s: string) => {
    const map: Record<string, string> = { 
      pushed: "bg-success-light text-success border-success/35", 
      ready: "bg-accent-glow text-accent-strong border-accent/35", 
      draft: "bg-ink-100 text-ink-400 border-ink-200", 
      failed: "bg-danger-light text-danger border-danger/35" 
    }
    return map[s] ?? "bg-ink-100 text-ink-450 border-ink-200"
  }

  const badgeText = (s: string) => {
    const map: Record<string, string> = { 
      pushed: "已推送", 
      ready: "就绪", 
      draft: "草稿", 
      failed: "失败" 
    }
    return map[s] ?? s
  }

  const handleReRender = async (pageId: string) => {
    setActionLoading(true)
    try {
      await api.reRenderPage(pageId)
      addEvent({ type: "system", message: "重新渲染页面命令发送成功" })
      await load()
      // Refresh selected page reference
      const updated = await api.getPageHistory(50)
      const found = updated.find(x => x.id === pageId)
      if (found) setSelectedPage(found)
    } catch {
      addEvent({ type: "alert", message: "重新渲染页面失败" })
    } finally {
      setActionLoading(false)
    }
  }

  const handlePush = async (pageId: string) => {
    if (!device) return
    setActionLoading(true)
    try {
      await api.pushPageToDevice(pageId, device.id)
      useDeviceStore.getState().setLastRefresh(new Date())
      addEvent({ type: "system", message: `已推送页面帧至墨水屏设备` })
      await load()
      // Refresh selected page reference
      const updated = await api.getPageHistory(50)
      const found = updated.find(x => x.id === pageId)
      if (found) setSelectedPage(found)
    } catch {
      addEvent({ type: "alert", message: "推送至墨水屏设备失败" })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Title and control bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-100 pb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xs font-mono font-bold tracking-widest text-ink-700 uppercase">
              // 历史渲染归档
            </h1>
            <p className="text-[11px] text-ink-400 font-sans">
              查看并审查过去所有的电子墨水屏渲染页面帧。支持历史帧的二次重绘与直接向屏幕的强行推送。
            </p>
          </div>
          <button 
            onClick={load} 
            disabled={loading}
            className="self-start sm:self-center inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-mono font-bold uppercase tracking-wider rounded border border-ink-200 bg-ink-50 hover:bg-ink-150 hover:text-accent-strong cursor-pointer transition-all duration-150"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            刷新归档
          </button>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Historical Arcs list (width 7/12) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50 select-none">
                <Archive size={13} className="text-purple" />
                渲染快照时间轴 ({pages.length})
              </div>
              
              <div className="p-4 space-y-2 overflow-y-auto max-h-[500px]">
                {pages.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="size-10 rounded-full bg-ink-50 flex items-center justify-center mb-3 border border-ink-100">
                      <Archive size={18} className="text-ink-300" />
                    </div>
                    <h3 className="text-xs font-semibold text-ink-700 uppercase font-mono tracking-wider">归档库为空</h3>
                    <p className="text-[11px] text-ink-400 mt-1">生成的 E-ink 页面快照将在归档数据库中自动保存。</p>
                  </div>
                ) : (
                  pages.map((p) => {
                    const isSelected = selectedPage?.id === p.id
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedPage(p)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded border transition-all duration-200 cursor-pointer
                          ${isSelected 
                            ? "bg-accent/5 border-accent/40 shadow-sm" 
                            : "bg-ink-50 border-ink-100 hover:border-accent/25 hover:bg-ink-50/70"
                          }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono font-bold text-ink-750 uppercase truncate">
                              {templateLabel[p.templateId] ?? p.templateId}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${badge(p.status)}`}>
                              {badgeText(p.status)}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-ink-400 truncate mt-1">
                            {p.reason ? `${p.reason} · ` : ""}{p.createdAt?.slice(0, 16).replace("T", " ") ?? ""}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Historical Inspector (width 5/12) */}
          <div className="lg:col-span-5 space-y-6">
            {selectedPage ? (
              <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50 select-none">
                  <FileText size={13} className="text-accent" />
                  快照详细参数审查
                </div>
                
                <div className="p-5 space-y-4 font-mono text-xs">
                  <div className="space-y-3 p-4 rounded bg-ink-50 border border-ink-100">
                    <div className="flex justify-between items-center pb-2 border-b border-ink-100/40">
                      <span className="text-ink-400 font-bold">帧标识 (ID)</span>
                      <span className="text-ink-700 select-all font-mono text-[10px] truncate max-w-[150px]">{selectedPage.id}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-ink-100/40">
                      <span className="text-ink-400 font-bold">模板类型</span>
                      <span className="text-accent font-bold">{templateLabel[selectedPage.templateId] ?? selectedPage.templateId}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-ink-100/40">
                      <span className="text-ink-400 font-bold">状态状态</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${badge(selectedPage.status)}`}>
                        {badgeText(selectedPage.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-ink-100/40">
                      <span className="text-ink-400 font-bold">生成原因</span>
                      <span className="text-ink-650 max-w-[160px] truncate text-right">{selectedPage.reason || "系统自检触发"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400 font-bold">记录时间</span>
                      <span className="text-ink-650">{selectedPage.createdAt?.slice(0, 19).replace("T", " ") ?? ""}</span>
                    </div>
                  </div>

                  {/* Actions inside inspector */}
                  <div className="space-y-3 pt-2">
                    <button 
                      onClick={() => handleReRender(selectedPage.id)}
                      disabled={actionLoading}
                      className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-purple text-white hover:bg-purple-strong disabled:opacity-30 transition-all duration-150"
                    >
                      <RefreshCw size={12} className={actionLoading ? "animate-spin" : ""} />
                      重新渲染此帧
                    </button>
                    
                    <button 
                      onClick={() => handlePush(selectedPage.id)}
                      disabled={!isOnline || actionLoading}
                      className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong disabled:opacity-30 transition-all duration-150"
                    >
                      <Send size={11} />
                      强行推送至屏幕
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="cyber-card rounded-lg overflow-hidden flex flex-col justify-center items-center p-8 text-center min-h-[300px] select-none">
                <div className="size-11 rounded-full bg-purple/10 flex items-center justify-center border border-purple/20 mb-4 animate-pulse">
                  <Archive size={18} className="text-purple" />
                </div>
                <h3 className="text-xs font-semibold text-ink-700 uppercase font-mono tracking-widest">请选择归档帧</h3>
                <p className="text-[11px] text-ink-400 mt-1.5 max-w-xs leading-relaxed">
                  在左侧时间轴中点击任一历史页面帧，即可在此处查看其运行参数详情、重新触发渲染，或直接推送到物理墨水屏设备。
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
