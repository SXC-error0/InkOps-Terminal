import { useState, useEffect } from "react"
import { Terminal as TerminalIcon, RefreshCw } from "lucide-react"
import * as api from "#/lib/api"

interface TerminalData {
  activeProject: string; githubStreak: number; todayCommits: number
  serverStatus: string; mvpProgress: number; currentFocus: string
}

export function TerminalPage() {
  const [data, setData] = useState<TerminalData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try { setData(await api.getTerminalSummary()) } catch { /* keep old */ }
    finally { setLoading(false) }
  }

  const items = [
    { label: "活跃项目", value: data?.activeProject ?? "..." },
    { label: "GitHub 连续", value: data ? `${data.githubStreak} 天` : "..." },
    { label: "今日提交", value: data?.todayCommits?.toString() ?? "..." },
    {
      label: "服务状态",
      value: data?.serverStatus ?? "...",
      color: data?.serverStatus === "ONLINE" ? "var(--color-success)" : "var(--color-danger)",
    },
  ]

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-lg mx-auto p-6">
        <div className="card">
          <div className="card-header">
            <TerminalIcon size={15} style={{ color: "var(--color-info)" }} />
            <span>数据看板</span>
            <button onClick={fetchData} className="btn btn-ghost ml-auto" style={{ padding: "4px 8px" }}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="card-body">
            <div className="rounded-lg p-5 space-y-3" style={{ background: "var(--color-bg)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
              <div className="text-center mb-4" style={{ color: "var(--color-accent)", fontSize: 12 }}>
                INKOPS TERMINAL / NODE-01
              </div>
              {items.map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
                  <span style={{ color: color ?? "var(--color-text)", fontWeight: color ? 600 : 400 }}>{value}</span>
                </div>
              ))}
              {/* 进度条 */}
              {data && (
                <div className="pt-1">
                  <div className="flex justify-between text-[12px] mb-1">
                    <span style={{ color: "var(--color-text-muted)" }}>MVP 进度</span>
                    <span style={{ color: "var(--color-accent)" }}>{data.mvpProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min(100, data.mvpProgress)}%`,
                      background: "var(--color-accent)",
                    }} />
                  </div>
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: 12 }}>
                <div className="text-[11px] mb-1" style={{ color: "var(--color-text-muted)" }}>当前聚焦</div>
                <div style={{ color: "var(--color-text)" }}>{data?.currentFocus ?? "加载中..."}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
