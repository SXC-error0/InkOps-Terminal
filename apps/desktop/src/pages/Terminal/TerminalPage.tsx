import { useState, useEffect } from "react"
import { Monitor, RefreshCw, GitCommit, Target, Activity } from "lucide-react"
import * as api from "#/lib/api"

interface D { activeProject: string; githubStreak: number; todayCommits: number; serverStatus: string; mvpProgress: number; currentFocus: string }

export function TerminalPage() {
  const [d, setD] = useState<D | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setD(await api.getTerminalSummary())
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Title and control bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-100 pb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xs font-mono font-bold tracking-widest text-ink-700 uppercase">
              // 终端控制与数据看板
            </h1>
            <p className="text-[11px] text-ink-400 font-sans">
              本地工作站开发提交记录、服务器环境指标以及实时进程编译控制日志。
            </p>
          </div>
          <button 
            onClick={load} 
            disabled={loading}
            className="self-start sm:self-center inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-mono font-bold uppercase tracking-wider rounded border border-ink-200 bg-ink-50 hover:bg-ink-150 hover:text-accent-strong cursor-pointer transition-all duration-150"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            刷新数据
          </button>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: CRT Terminal Shell */}
          <div className="lg:col-span-7 space-y-6">
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50 select-none">
                <Monitor size={13} className="text-success" />
                主机终端显示器
              </div>
              <div className="p-5 bg-ink-25">
                <div className="crt-monitor crt-overlay p-6 font-mono text-xs space-y-4 text-success border border-success/30 rounded relative min-h-[360px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-center text-[10px] text-success/60 tracking-widest pb-2 border-b border-success/20 uppercase">// INKOPS 监控主机 //</div>
                    
                    <Row l="当前活跃项目" v={d?.activeProject} />
                    <Row l="GITHUB 提交连击" v={d ? `${d.githubStreak} 天连续` : "..."} />
                    <Row l="今日提交次数" v={d ? `${d.todayCommits} 次` : "..."} />
                    <Row l="服务器运行状态" v={d?.serverStatus === "ONLINE" ? "在线" : d?.serverStatus} c={d?.serverStatus === "ONLINE" ? "text-success font-bold" : "text-danger font-bold"} />
                    
                    <div className="h-px bg-success/20" />
                    
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-success/75">系统总进度</span>
                      <span>{d?.mvpProgress ?? 0}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded bg-success/15 overflow-hidden border border-success/20">
                      <div 
                        className="h-full rounded bg-success progress-sweep transition-all duration-1000 ease-out" 
                        style={{ width: `${Math.min(100, d?.mvpProgress ?? 0)}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="h-px bg-success/20 mb-3" />
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-success/40 font-bold">$</span>
                      <span className="text-success/80">systemctl status ink-engine.service --no-pager</span>
                      <span className="animate-pulse bg-success w-1.5 h-3.5 inline-block shadow-[0_0_6px_rgba(16,185,129,0.7)] ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Diagnostic & System Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Git streaker card */}
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 h-10 px-5 border-b border-ink-100 text-[10px] font-mono tracking-wider font-bold text-ink-400 uppercase bg-ink-50/50">
                <GitCommit size={12} className="text-accent" />
                版本控制开发活跃度
              </div>
              <div className="p-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-ink-400">累计提交连击</span>
                  <span className="text-accent font-bold">{d ? `${d.githubStreak} 天连续` : "..."}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-400">今日贡献</span>
                  <span className="text-ink-700 font-bold">{d?.todayCommits ?? 0} 个提交</span>
                </div>
              </div>
            </div>

            {/* Current focus card */}
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 h-10 px-5 border-b border-ink-100 text-[10px] font-mono tracking-wider font-bold text-ink-400 uppercase bg-ink-50/50">
                <Target size={12} className="text-warning" />
                当前开发任务目标
              </div>
              <div className="p-4 space-y-3">
                <div className="font-mono text-[10px] font-bold text-ink-400 uppercase">当前指令 //</div>
                <p className="text-xs text-ink-600 font-sans leading-relaxed border-l border-warning/30 pl-3">
                  {d?.currentFocus ?? "无活跃目标。就绪以接收新功能或修复指令。"}
                </p>
              </div>
            </div>

            {/* Micro server telemetry status card */}
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 h-10 px-5 border-b border-ink-100 text-[10px] font-mono tracking-wider font-bold text-ink-400 uppercase bg-ink-50/50">
                <Activity size={12} className="text-accent-light" />
                DOCKER 引擎状态监测
              </div>
              <div className="p-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-ink-400">系统代理</span>
                  <span className="text-success font-bold">在线</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-400">数据同步通道</span>
                  <span className="text-ink-600">WEBSOCKET v2.4</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

const Row = ({ l, v, c }: { l: string; v?: string; c?: string }) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-success/70 font-bold uppercase">{l}</span>
    <span className={c ?? "text-success"}>{v ?? "..."}</span>
  </div>
)
