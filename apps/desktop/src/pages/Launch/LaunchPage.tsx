import { useState } from "react"
import { Rocket, Clock, Cpu } from "lucide-react"
import * as api from "#/lib/api"

export function LaunchPage() {
  const [name, setName] = useState("")
  const [b, setB] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const create = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const p = await api.createProject(name) as { id: string }
      setB(await api.getProjectBriefing(p.id) as Record<string, unknown>)
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }

  const proj = b?.project as Record<string, unknown> | undefined
  const blockers = (b?.blockers as string[]) ?? []
  const progress = (proj?.progress as number) ?? 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Title & header info */}
        <div className="flex flex-col gap-1 border-b border-ink-100 pb-4">
          <h1 className="text-xs font-mono font-bold tracking-widest text-ink-700 uppercase">
            // 项目发布推进路线
          </h1>
          <p className="text-[11px] text-ink-400 font-sans">
            AI 驱动的项目进度评估、自动化发布阻碍排查及发布策略指令。
          </p>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Input and Basic Metrics */}
          <div className="lg:col-span-6 space-y-6">
            <div className="cyber-card rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50 select-none">
                <Rocket size={13} className="text-accent" />
                发布任务控制器
              </div>
              <div className="p-5 space-y-5">
                {!b ? (
                  <div className="space-y-4">
                    <p className="text-xs text-ink-400 font-mono uppercase tracking-wide">
                      输入产品/项目名称，AI 将自动分析并绘制发布进度。
                    </p>
                    <div className="flex gap-2.5">
                      <input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="w-full h-9 px-3 text-xs font-mono rounded outline-none flex-1" 
                        placeholder="例如: InkOps Terminal" 
                        onKeyDown={(e) => e.key === "Enter" && create()} 
                      />
                      <button 
                        onClick={create} 
                        disabled={!name.trim() || loading} 
                        className="inline-flex items-center justify-center gap-1.5 h-9 px-5 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <Rocket size={13} />
                        {loading ? "分析路线中..." : "启动路线分析"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 animate-fade-in">
                    {/* Project Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono tracking-wider">
                        <span className="text-ink-650 font-bold uppercase">项目名称: {(proj?.name as string) ?? name}</span>
                        <span className="font-bold text-accent">{progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded bg-ink-100 overflow-hidden border border-ink-200">
                        <div 
                          className="h-full rounded bg-gradient-to-r from-accent to-accent-strong progress-sweep transition-all duration-1000 ease-out" 
                          style={{ width: `${Math.min(100, progress)}%` }} 
                        />
                      </div>
                    </div>

                    {/* T-Minus Countdown panel */}
                    <div className="flex items-center gap-2.5 p-3.5 rounded bg-ink-50 border border-ink-100 font-mono text-xs">
                      <Clock size={14} className="text-warning animate-pulse" />
                      <span className="text-ink-400 font-bold uppercase">距离上线预计：</span>
                      <span className="text-warning font-bold font-mono tracking-widest bg-warning-light px-2.5 py-0.5 border border-warning/20 rounded">
                        {(b?.countdown_days as number ?? 0)} 天
                      </span>
                    </div>

                    {/* Reset Button */}
                    <button 
                      onClick={() => { setB(null); setName("") }} 
                      className="w-full inline-flex items-center justify-center h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-ink-50 text-ink-600 border border-ink-200 hover:bg-ink-150 hover:border-accent/40 transition-all duration-150"
                    >
                      重置目标项目
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Blockers alert list */}
            {b && blockers.length > 0 && (
              <div className="cyber-card rounded-lg overflow-hidden border-danger/30 animate-fade-in">
                <div className="flex items-center gap-2 h-10 px-5 border-b border-danger/25 text-[10px] font-mono tracking-wider font-bold text-danger uppercase bg-danger/5 select-none relative">
                  <span className="relative flex size-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-danger" />
                  </span>
                  发布关键阻碍因素
                </div>
                <div className="p-4 space-y-2 pl-6">
                  {blockers.map((x, i) => (
                    <div key={i} className="text-xs text-ink-500 font-mono leading-relaxed list-item list-disc">
                      {x}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Directive */}
          <div className="lg:col-span-6 space-y-6">
            {b ? (
              <div className="cyber-card rounded-lg overflow-hidden border-accent/20 animate-fade-in">
                {/* Warning hazard stripes */}
                <div className="hazard-line" />
                <div className="p-5 bg-accent/5 space-y-4">
                  <p className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest">
                    AI 首席教练项目推进核心指令
                  </p>
                  <p className="text-ink-700 text-[13px] font-medium leading-relaxed font-sans border-l-2 border-accent pl-4">
                    {b?.today_instruction as string ?? "所有系统指标正常。请继续按照路线图推进行动。"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="cyber-card rounded-lg overflow-hidden flex flex-col justify-center items-center p-8 text-center min-h-[220px] select-none">
                <div className="size-11 rounded-full bg-accent-glow flex items-center justify-center border border-accent/20 mb-4 animate-pulse">
                  <Cpu size={18} className="text-accent" />
                </div>
                <h3 className="text-xs font-semibold text-ink-700 uppercase font-mono tracking-widest">AI 推进教练就绪</h3>
                <p className="text-[11px] text-ink-400 mt-1.5 max-w-xs leading-relaxed">
                  AI 推进教练已准备就绪。提交项目名称后即可启动评估与优化指导。
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
