import { useState, useEffect } from "react"
import { ShieldAlert, Globe, Plus, RefreshCw, AlertTriangle } from "lucide-react"
import { useDeviceStore } from "#/stores/deviceStore"
import * as api from "#/lib/api"

interface M { id: string; name: string; target_type: string; endpoint: string; status: string }
interface I { id: string; monitor_id: string; level: string; summary: string; opened_at: string }

export function WatcherPage() {
  const isOnline = useDeviceStore((s) => s.isOnline)
  const [mons, setMons] = useState<M[]>([])
  const [incs, setIncs] = useState<I[]>([])
  const [show, setShow] = useState(false)
  const [nm, setNm] = useState("")
  const [ep, setEp] = useState("")
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [m, i] = await Promise.all([
        api.getMonitors() as Promise<M[]>,
        api.getActiveIncidents() as Promise<I[]>
      ])
      setMons(m)
      setIncs(i)
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!nm || !ep) return
    await api.createMonitor({ name: nm, target_type: "http", endpoint: ep })
    setShow(false)
    setNm("")
    setEp("")
    await load()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Title and stats summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-100 pb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xs font-mono font-bold tracking-widest text-ink-700 uppercase">
              // 监控告警控制台
            </h1>
            <p className="text-[11px] text-ink-400 font-sans">
              配置 HTTP 检查目标、自动检测周期以及活跃的异常事件警报记录。
            </p>
          </div>
          <button 
            onClick={load} 
            disabled={loading}
            className="self-start sm:self-center inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-mono font-bold uppercase tracking-wider rounded border border-ink-200 bg-ink-50 hover:bg-ink-150 hover:text-accent-strong cursor-pointer transition-all duration-150"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            刷新状态
          </button>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Watcher Endpoints list */}
          <div className="lg:col-span-7 space-y-6">
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50 select-none">
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-accent" />
                  已配置的监控目标 ({mons.length})
                </div>
                <button 
                  onClick={() => setShow(!show)} 
                  className={`inline-flex items-center justify-center gap-1 h-6 px-2.5 text-[10px] font-mono font-bold uppercase rounded border transition-all duration-150 cursor-pointer
                    ${show 
                      ? "bg-danger-light text-danger border-danger/20 hover:bg-danger-light/80" 
                      : "bg-ink-100 text-ink-400 border-ink-200 hover:text-accent-strong hover:border-accent/40"
                    }`}
                >
                  <Plus size={10} className={`transition-transform duration-200 ${show ? "rotate-45" : ""}`} />
                  {show ? "取消" : "添加"}
                </button>
              </div>
              
              {show && (
                <div className="p-4 flex gap-2 border-b border-ink-100 bg-ink-50/30 animate-fade-in">
                  <input 
                    value={nm} 
                    onChange={(e) => setNm(e.target.value)} 
                    className="h-9 px-3 text-xs font-mono rounded outline-none w-32" 
                    placeholder="名称 (如: 接口服务)" 
                  />
                  <input 
                    value={ep} 
                    onChange={(e) => setEp(e.target.value)} 
                    className="h-9 px-3 text-xs font-mono rounded outline-none flex-1" 
                    placeholder="https://api.example.com/health" 
                  />
                  <button 
                    onClick={add} 
                    className="inline-flex items-center justify-center h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong transition-all duration-150"
                  >
                    确认添加
                  </button>
                </div>
              )}
              
              <div className="p-5 space-y-3">
                {mons.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="size-10 rounded-full bg-ink-50 flex items-center justify-center mb-3 border border-ink-100">
                      <Globe size={18} className="text-ink-300" />
                    </div>
                    <h3 className="text-xs font-semibold text-ink-700 uppercase font-mono tracking-wider">当前无监控目标</h3>
                    <p className="text-[11px] text-ink-400 mt-1">配置 HTTP 端点检测，实现后端与接口服务状态的实时看板追踪。</p>
                  </div>
                ) : (
                  mons.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-4 py-3.5 rounded bg-ink-50 border border-ink-100 hover:border-accent/30 transition-all duration-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <Globe size={14} className="text-ink-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-bold text-ink-700 truncate uppercase">{m.name}</div>
                          <div className="text-[10px] font-mono text-ink-400 truncate mt-0.5">{m.endpoint}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border ${
                          m.status === "online" 
                            ? "bg-success-light text-success border-success/35 shadow-sm shadow-success/10" 
                            : "bg-danger-light text-danger border-danger/35 shadow-sm shadow-danger/10 animate-pulse"
                        }`}>
                          {m.status === "online" ? "在线" : "离线"}
                        </span>
                        <button 
                          onClick={async () => { await api.runHealthCheck(m.id); await load() }} 
                          className="inline-flex items-center justify-center size-8 rounded text-ink-400 hover:bg-ink-150 hover:text-accent-strong cursor-pointer border border-transparent hover:border-ink-200 transition-all duration-150"
                          title="立即检测"
                        >
                          <RefreshCw size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Active Incidents list */}
          <div className="lg:col-span-5 space-y-6">
            {incs.length > 0 ? (
              <div className="cyber-card rounded-lg overflow-hidden border-danger/30">
                <div className="flex items-center gap-2.5 h-11 px-5 border-b border-danger/25 text-xs font-mono tracking-wider font-bold text-danger uppercase bg-danger/5 select-none relative">
                  <span className="relative flex size-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-danger" />
                  </span>
                  活跃的监控警报 ({incs.length})
                </div>
                
                <div className="p-5 space-y-3.5">
                  {incs.map((inc) => (
                    <div key={inc.id} className="flex flex-col gap-2 p-4 rounded border border-danger/20 bg-danger/5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="font-bold text-danger uppercase tracking-wider">告警级别: {inc.level}</span>
                        <span className="text-ink-400">{inc.opened_at?.slice(0, 19).replace("T", " ")}</span>
                      </div>
                      <p className="text-xs text-ink-500 font-sans leading-relaxed mt-1">
                        {inc.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : !isOnline ? (
              <div className="cyber-card rounded-lg overflow-hidden flex flex-col justify-center items-center p-8 text-center min-h-[300px] select-none border-warning/30">
                <div className="size-11 rounded-full bg-warning-light flex items-center justify-center border border-warning/20 mb-4 animate-pulse">
                  <AlertTriangle size={18} className="text-warning" />
                </div>
                <h3 className="text-xs font-semibold text-warning uppercase font-mono tracking-widest">物理设备已离线</h3>
                <p className="text-[11px] text-ink-400 mt-1.5 max-w-xs leading-relaxed">
                  当前未绑定或无法连接到 ESP8266 物理硬件节点。请前往 [设备管理] 面板扫描并绑定物理节点 IP 地址。
                </p>
              </div>
            ) : (
              <div className="cyber-card rounded-lg overflow-hidden flex flex-col justify-center items-center p-8 text-center min-h-[300px] select-none">
                <div className="size-11 rounded-full bg-success-light flex items-center justify-center border border-success/20 mb-4 animate-pulse">
                  <ShieldAlert size={18} className="text-success" />
                </div>
                <h3 className="text-xs font-semibold text-success uppercase font-mono tracking-widest">系统运行安全</h3>
                <p className="text-[11px] text-ink-400 mt-1.5 max-w-xs leading-relaxed">
                  未检测到任何异常警报。所有已配置端点的信号扫描与运行状态均处于正常范围内。
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
