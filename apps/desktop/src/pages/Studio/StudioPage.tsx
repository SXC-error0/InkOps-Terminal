import { useState, useEffect } from "react"
import { Palette, RefreshCw } from "lucide-react"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"
import type { Page } from "#/lib/types"

export function StudioPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const addEvent = useEventStore((s) => s.addEvent)

  const load = async () => { setLoading(true); try { setPages(await api.getPageHistory(50)) } catch { /* */ } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pushed: "badge-green", ready: "badge-blue", draft: "badge-slate", failed: "badge-red" }
    return map[s] ?? "badge-slate"
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        <div className="card">
          <div className="card-header">
            <Palette size={15} style={{ color: "var(--color-purple)" }} />
            <span>历史归档</span>
            <button onClick={load} className="btn btn-ghost ml-auto" style={{ padding: "4px 8px" }}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="card-body space-y-2">
            {pages.length === 0 ? (
              <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>
                <Palette size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-[13px]">暂无页面, 生成后在此显示</p>
              </div>
            ) : (
              pages.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border-light)" }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium truncate" style={{ color: "var(--color-text)" }}>{p.templateId}</span>
                      <span className={`badge ${statusBadge(p.status)}`}>{p.status.toUpperCase()}</span>
                    </div>
                    <div className="text-[11px] mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                      {p.reason ?? ""} · {p.createdAt?.slice(0, 16) ?? ""}
                    </div>
                  </div>
                  <button
                    onClick={async () => { try { await api.reRenderPage(p.id); addEvent({ type: "system", message: "已重渲染" }); await load() } catch { /* */ } }}
                    className="btn btn-secondary shrink-0 ml-3"
                    style={{ padding: "4px 10px", fontSize: 11 }}
                  >
                    重渲染
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
