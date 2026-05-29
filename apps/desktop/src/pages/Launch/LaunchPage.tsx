import { useState } from "react"
import { Rocket, Clock } from "lucide-react"
import * as api from "#/lib/api"

export function LaunchPage() {
  const [name, setName] = useState(""); const [b, setB] = useState<Record<string, unknown> | null>(null); const [loading, setLoading] = useState(false)
  const create = async () => { if (!name.trim()) return; setLoading(true); try { const p = await api.createProject(name) as { id: string }; setB(await api.getProjectBriefing(p.id) as Record<string, unknown>) } catch { /* */ } finally { setLoading(false) } }
  const proj = b?.project as Record<string, unknown> | undefined; const blockers = (b?.blockers as string[]) ?? []; const progress = (proj?.progress as number) ?? 0

  return (
    <div className="h-full overflow-auto"><div className="p-6"><div className="max-w-xl mx-auto">
      <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none"><Rocket size={15} className="text-accent" />项目进度</div>
        <div className="p-5 space-y-5">
          {!b ? (
            <>
              <p className="text-sm text-ink-500">输入产品名称，AI 分析上线路径并给出今日唯一关键行动。</p>
              <div className="flex gap-3"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-[34px] px-2.5 text-sm font-sans text-ink-600 bg-white border border-ink-200 rounded placeholder:text-ink-300 focus:border-accent focus:ring-3 focus:ring-accent-light outline-none transition-all duration-150 flex-1" placeholder="产品名称" onKeyDown={(e) => e.key === "Enter" && create()} /><button onClick={create} disabled={!name.trim() || loading} className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 text-sm font-medium rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong disabled:opacity-35 disabled:cursor-not-allowed transition-colors"><Rocket size={14} />{loading ? "分析中..." : "开始分析"}</button></div>
            </>
          ) : (
            <>
              <div><div className="flex justify-between text-sm mb-2"><span className="text-ink-500">{proj?.name ?? name}</span><span className="font-semibold text-accent">{progress}%</span></div><div className="w-full h-1 rounded-full bg-ink-100 overflow-hidden"><div className="h-full rounded-full bg-accent transition-all duration-600 ease-out" style={{ width: `${Math.min(100, progress)}%` }} /></div></div>
              {blockers.length > 0 && <div className="flex items-start gap-2.5 p-3 rounded-md bg-danger-light/50 border border-danger-light text-[13px]"><div><p className="font-medium text-danger">⚠ 阻塞项</p>{blockers.map((x, i) => <p key={i} className="text-ink-500 mt-0.5">• {x}</p>)}</div></div>}
              <div className="flex items-center gap-2 text-sm"><Clock size={14} className="text-warning" /><span className="text-ink-500">距上线 T-{b?.countdown_days as number ?? 0} 天</span></div>
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-accent-light/50 border border-accent-light text-[13px]"><div><p className="font-medium text-accent-strong">AI 今日指令</p><p className="text-ink-700 mt-0.5 text-sm font-medium">{b?.today_instruction as string ?? "继续推进"}</p></div></div>
            </>
          )}
        </div>
      </div>
    </div></div></div>
  )
}
