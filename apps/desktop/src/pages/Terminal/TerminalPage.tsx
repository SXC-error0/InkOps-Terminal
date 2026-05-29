import { useState, useEffect } from "react"
import { Monitor, RefreshCw } from "lucide-react"
import * as api from "#/lib/api"

interface D { activeProject: string; githubStreak: number; todayCommits: number; serverStatus: string; mvpProgress: number; currentFocus: string }

export function TerminalPage() {
  const [d, setD] = useState<D | null>(null); const [loading, setLoading] = useState(true)
  useEffect(() => { load() }, [])
  const load = async () => { setLoading(true); try { setD(await api.getTerminalSummary()) } catch { /* */ } finally { setLoading(false) } }

  return (
    <div className="h-full overflow-auto"><div className="p-6"><div className="max-w-lg mx-auto">
      <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none">
          <Monitor size={15} className="text-purple" />数据看板
          <button onClick={load} className="ml-auto inline-flex items-center justify-center h-7 px-2.5 text-xs font-medium rounded text-ink-400 hover:bg-ink-50 hover:text-ink-500 transition-colors"><RefreshCw size={11} className={loading ? "animate-spin" : ""} /></button>
        </div>
        <div className="p-5">
          <div className="bg-ink-50 border border-ink-100 rounded-md p-4 font-mono text-xs space-y-2.5 text-ink-500">
            <div className="text-center text-accent text-[11px]">INKOPS TERMINAL / NODE-01</div>
            <Row l="活跃项目" v={d?.activeProject} /><Row l="GitHub" v={d ? `${d.githubStreak} 天` : "..."} /><Row l="今日提交" v={d?.todayCommits?.toString()} /><Row l="服务状态" v={d?.serverStatus} c={d?.serverStatus === "ONLINE" ? "text-success" : "text-danger"} />
            <div className="h-px bg-ink-100" />
            <div className="flex justify-between"><span className="text-ink-400">MVP 进度</span><span className="text-accent">{d?.mvpProgress ?? 0}%</span></div>
            <div className="w-full h-1 rounded-full bg-ink-100 overflow-hidden"><div className="h-full rounded-full bg-accent transition-all duration-600 ease-out" style={{ width: `${Math.min(100, d?.mvpProgress ?? 0)}%` }} /></div>
            <div className="h-px bg-ink-100" /><div className="text-ink-400">当前聚焦</div><div className="text-ink-700">{d?.currentFocus}</div>
          </div>
        </div>
      </div>
    </div></div></div>
  )
}
const Row = ({ l, v, c }: { l: string; v?: string; c?: string }) => (
  <div className="flex justify-between"><span className="text-ink-400">{l}</span><span className={c ?? "text-ink-600"}>{v ?? "..."}</span></div>
)
