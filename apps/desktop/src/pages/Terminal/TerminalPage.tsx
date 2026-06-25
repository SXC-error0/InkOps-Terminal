import { useState, useEffect } from "react"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"

interface TerminalData {
  activeProject: string
  githubStreak: number
  todayCommits: number
  serverStatus: string
  mvpProgress: number
  currentFocus: string
}

// ── Progress Bar Row ──────────────────────────────────────────────

function MetricBar({ label, value, display, color = "bg-primary" }: { label: string; value: number; display: string; color?: string }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-on-surface-variant text-[16px]">{label}</span>
        <span className="font-mono text-[13px] text-primary">{display}</span>
      </div>
      <div className="w-full bg-surface-variant h-2 overflow-hidden">
        <div className={`${color} h-full transition-all duration-700`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  )
}

// ── Service Row ───────────────────────────────────────────────────

function ServiceRow({
  icon,
  label,
  value,
  status,
}: {
  icon: string
  label: string
  value: string
  status: "online" | "warning" | "offline"
}) {
  const dot =
    status === "online"
      ? "bg-secondary"
      : status === "warning"
      ? "bg-on-tertiary-container"
      : "bg-error"
  const valueColor =
    status === "warning" ? "text-on-tertiary-container" : status === "offline" ? "text-error" : "text-primary"

  return (
    <div className="flex justify-between items-center border-b border-surface-variant pb-3 last:border-0 last:pb-0">
      <span className="text-on-surface-variant text-[14px] flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className={`font-mono text-[13px] ${valueColor}`}>{value}</span>
        <span className={`w-2 h-2 rounded-full ${dot}`} />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export function TerminalPage() {
  const [data, setData] = useState<TerminalData | null>(null)
  const [loading, setLoading] = useState(true)
  const device = useDeviceStore((s) => s.device)
  const addEvent = useEventStore((s) => s.addEvent)

  const load = async () => {
    setLoading(true)
    try {
      setData(await api.getTerminalSummary())
    } catch {
      /* backend may be offline */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const pushReminder = async (label: string) => {
    if (!device) { addEvent({ type: "alert", message: "设备未绑定" }); return }
    try {
      const pages = await api.getPageHistory(1)
      if (pages[0]) await api.pushPageToDevice(pages[0].id, device.id)
      addEvent({ type: "system", message: `已推送提醒: ${label}` })
    } catch {
      addEvent({ type: "alert", message: "推送失败" })
    }
  }

  const cpu = 34
  const ram = 50
  const disk = 89

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-8 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="mb-2 flex justify-between items-end">
          <div>
            <h2 className="font-display font-bold text-primary text-[32px] mb-2">系统与开发状态</h2>
            <p className="text-on-surface-variant text-[16px]">System &amp; Dev Environment Status Overview</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="bg-primary text-on-primary py-2 px-6 flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity text-[14px]"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>sync</span>
            刷新全部状态
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Git Workspace Alert — full width */}
          <div className="col-span-1 lg:col-span-12 bento-card border-error">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-error/20">
              <div className="font-mono text-[11px] text-error flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                GIT WORKSPACE ALERT
              </div>
              <button
                onClick={() => pushReminder("Git 工作区提醒")}
                className="text-[11px] font-mono border border-error text-error px-3 py-1 hover:bg-error hover:text-on-error transition-colors"
              >
                生成提醒页面 (E-INK)
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="font-display font-semibold text-primary text-[24px] mb-2">检测到未提交的更改</h3>
                <p className="text-on-surface-variant text-[16px] mb-4">
                  存在 {data?.todayCommits ?? 5} 个未提交的文件和 1 个缺失文档的模块。请在离开工作站前处理。
                </p>
                <div className="bg-surface-variant p-4 border border-outline-variant font-mono text-[13px] text-on-surface-variant overflow-x-auto">
                  <pre>{`M  src/api/routes.py\nM  src/models/user.py\n?? docs/api_v2_spec.md\n?? scripts/deploy_staging.sh`}</pre>
                </div>
              </div>
              <div className="w-full md:w-64 flex flex-col justify-center gap-3">
                <button className="w-full bg-surface-container-lowest border border-outline text-primary py-2 hover:bg-surface-variant transition-colors text-[14px]">
                  Git Commit All
                </button>
                <button className="w-full bg-surface-container-lowest border border-outline text-primary py-2 hover:bg-surface-variant transition-colors text-[14px]">
                  Stash Changes
                </button>
              </div>
            </div>
          </div>

          {/* System Health Grid (col-span-8) */}
          <div className="col-span-1 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* CPU & RAM */}
            <div className="bento-card">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline-variant">
                <span className="font-mono text-[11px] text-on-surface-variant">HARDWARE METRICS</span>
                <span className="px-2 py-0.5 text-[10px] font-mono border border-secondary text-secondary">STABLE</span>
              </div>
              <div className="space-y-6">
                <MetricBar label="CPU 使用率" value={cpu} display={`${cpu}%`} />
                <MetricBar label="内存 (RAM)" value={ram} display="16GB / 32GB" />
              </div>
            </div>

            {/* Storage & Network */}
            <div className="bento-card">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline-variant">
                <span className="font-mono text-[11px] text-on-surface-variant">STORAGE &amp; NET</span>
                <button
                  onClick={() => pushReminder("磁盘空间提醒")}
                  className="text-[10px] font-mono border border-outline text-primary px-2 py-0.5 hover:bg-surface-variant transition-colors"
                >
                  REMINDER
                </button>
              </div>
              <div className="space-y-6">
                <MetricBar
                  label="磁盘 /dev/nvme0n1"
                  value={disk}
                  display="89%"
                  color="bg-on-tertiary-container"
                />
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-[16px]">网络出口</span>
                  <span className="font-mono text-[13px] text-primary">1.2 MB/s ↑</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dev Environment (col-span-4) */}
          <div className="col-span-1 lg:col-span-4 bento-card flex flex-col gap-0">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline-variant">
              <span className="font-mono text-[11px] text-on-surface-variant">DEV ENV SERVICES</span>
              <button
                onClick={() => pushReminder("开发环境状态")}
                className="text-[10px] font-mono border border-outline text-primary px-2 py-0.5 hover:bg-surface-variant transition-colors"
              >
                REMINDER
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <ServiceRow icon="javascript" label="Node.js" value={`v${data?.mvpProgress ? "20.11.0" : "20.11.0"}`} status="online" />
              <ServiceRow icon="terminal" label="Python venv" value="Active (.venv)" status="online" />
              <ServiceRow icon="api" label="FastAPI Dev Server" value="Port 8700" status="online" />
              <ServiceRow
                icon="database"
                label="PostgreSQL"
                value={data?.serverStatus === "ONLINE" ? "运行中" : "重启中..."}
                status={data?.serverStatus === "ONLINE" ? "online" : "warning"}
              />
            </div>

            {/* Git Stats */}
            <div className="mt-6 pt-4 border-t border-outline-variant space-y-3">
              <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">版本控制活跃度</p>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant text-[14px]">提交连击</span>
                <span className="font-mono text-[13px] text-secondary font-bold">
                  {data ? `${data.githubStreak} 天` : "..."}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant text-[14px]">今日贡献</span>
                <span className="font-mono text-[13px] text-primary font-bold">
                  {data ? `${data.todayCommits} 次提交` : "..."}
                </span>
              </div>
              {data?.currentFocus && (
                <div className="pt-3 border-t border-outline-variant">
                  <p className="font-mono text-[11px] text-on-surface-variant mb-1 uppercase">当前焦点</p>
                  <p className="text-[13px] text-primary border-l-2 border-secondary pl-3 leading-relaxed">
                    {data.currentFocus}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
