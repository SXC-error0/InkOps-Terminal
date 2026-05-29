import { useState, useEffect } from "react"
import { Archive, RefreshCw } from "lucide-react"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"
import type { Page } from "#/lib/types"

export function StudioPage() {
  const [pages, setPages] = useState<Page[]>([]); const [loading, setLoading] = useState(true)
  const addEvent = useEventStore((s) => s.addEvent)
  const load = async () => { setLoading(true); try { setPages(await api.getPageHistory(50)) } catch { /* */ } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const badge = (s: string) => {
    const map: Record<string, string> = { pushed: "bg-success-light text-success", ready: "bg-accent-light text-accent-strong", draft: "bg-ink-100 text-ink-500", failed: "bg-danger-light text-danger" }
    return map[s] ?? "bg-ink-100 text-ink-500"
  }

  return (
    <div className="h-full overflow-auto"><div className="p-6"><div className="max-w-xl mx-auto">
      <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none"><Archive size={15} className="text-purple" />历史归档<button onClick={load} className="ml-auto inline-flex items-center justify-center h-7 px-2.5 text-xs font-medium rounded text-ink-400 hover:bg-ink-50 hover:text-ink-500 transition-colors"><RefreshCw size={11} className={loading ? "animate-spin" : ""} /></button></div>
        <div className="p-4 space-y-1.5">
          {pages.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center"><div className="size-10 rounded-full bg-ink-50 flex items-center justify-center mb-3"><Archive size={20} className="text-ink-200" /></div><h3 className="text-sm font-medium text-ink-500">暂无页面</h3><p className="text-xs text-ink-400 mt-1">生成后在此显示</p></div>
          ) : pages.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-md bg-ink-50 border border-ink-100">
              <div className="min-w-0"><div className="flex items-center gap-2"><span className="text-[13px] font-medium text-ink-600 truncate">{p.templateId}</span><span className={`inline-flex items-center h-[22px] px-2 text-[11px] font-medium rounded whitespace-nowrap ${badge(p.status)}`}>{p.status}</span></div><div className="text-[11px] text-ink-400 truncate mt-0.5">{p.reason ?? ""} · {p.createdAt?.slice(0, 16) ?? ""}</div></div>
              <button onClick={async () => { try { await api.reRenderPage(p.id); addEvent({ type: "system", message: "已重渲染" }); await load() } catch { /* */ } }} className="inline-flex items-center justify-center h-7 px-2.5 text-xs font-medium rounded shrink-0 ml-3 bg-white text-ink-500 border border-ink-200 hover:bg-ink-50 hover:text-ink-600 transition-colors">重渲染</button>
            </div>
          ))}
        </div>
      </div>
    </div></div></div>
  )
}
