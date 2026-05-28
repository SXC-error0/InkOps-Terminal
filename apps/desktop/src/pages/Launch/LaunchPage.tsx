import { useState } from "react"
import { Rocket, Clock, AlertTriangle } from "lucide-react"
import * as api from "#/lib/api"

export function LaunchPage() {
  const [name, setName] = useState("")
  const [briefing, setBriefing] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const project = await api.createProject(name) as { id: string }
      const brief = await api.getProjectBriefing(project.id) as Record<string, unknown>
      setBriefing(brief)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const project = briefing?.project as Record<string, unknown> | undefined
  const blockers = (briefing?.blockers as string[]) ?? []

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div className="card">
          <div className="card-header">
            <Rocket size={15} style={{ color: "var(--color-accent)" }} />
            <span>项目进度</span>
          </div>
          <div className="card-body space-y-4">
            {!briefing ? (
              <>
                <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
                  输入产品名称, AI 将分析上线路径并给出今日唯一关键行动。
                </p>
                <div className="flex gap-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input flex-1"
                    placeholder="产品名称, 如 InkOps Terminal"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                  <button onClick={handleCreate} disabled={!name.trim() || loading} className="btn btn-primary">
                    <Rocket size={14} />
                    {loading ? "分析中..." : "开始分析"}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {/* 进度条 */}
                <div>
                  <div className="flex justify-between text-[13px] mb-2">
                    <span style={{ color: "var(--color-text-secondary)" }}>{project?.name ?? name}</span>
                    <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>{project?.progress ?? 0}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: "var(--color-bg)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${Math.min(100, (project?.progress as number) ?? 0)}%`,
                      background: "var(--color-accent)",
                    }} />
                  </div>
                </div>

                {/* 阻塞项 */}
                {blockers.length > 0 && (
                  <div className="rounded-lg p-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} style={{ color: "var(--color-danger)" }} />
                      <span className="text-[13px] font-medium" style={{ color: "var(--color-danger)" }}>阻塞项</span>
                    </div>
                    {blockers.map((b, i) => (
                      <div key={i} className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>• {b}</div>
                    ))}
                  </div>
                )}

                {/* 倒计时 */}
                <div className="flex items-center gap-4 text-[13px]">
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: "var(--color-warning)" }} />
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      距上线 T-{briefing?.countdown_days as number ?? 0} 天
                    </span>
                  </div>
                </div>

                {/* AI 今日指令 */}
                <div className="rounded-lg p-4" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <div className="text-[11px] mb-1" style={{ color: "var(--color-accent)" }}>AI 今日指令</div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--color-text)" }}>
                    {briefing?.today_instruction as string ?? "继续推进"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
