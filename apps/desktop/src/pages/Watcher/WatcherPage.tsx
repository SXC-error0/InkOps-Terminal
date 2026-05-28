import { useState, useEffect } from "react"
import { ShieldAlert, Globe, RefreshCw, Plus, Activity } from "lucide-react"
import * as api from "#/lib/api"

interface MonitorInfo { id: string; name: string; target_type: string; endpoint: string; status: string; last_checked_at: string | null }
interface IncidentInfo { id: string; monitor_id: string; level: string; summary: string; opened_at: string }

export function WatcherPage() {
  const [monitors, setMonitors] = useState<MonitorInfo[]>([])
  const [incidents, setIncidents] = useState<IncidentInfo[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState(""); const [endpoint, setEndpoint] = useState("")

  const load = async () => {
    try {
      const [m, i] = await Promise.all([api.getMonitors() as Promise<MonitorInfo[]>, api.getActiveIncidents() as Promise<IncidentInfo[]>])
      setMonitors(m); setIncidents(i)
    } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!name || !endpoint) return
    await api.createMonitor({ name, target_type: "http", endpoint })
    setShowAdd(false); setName(""); setEndpoint(""); await load()
  }

  const statusStyle = (s: string) => s === "online" ? { color: "var(--color-success)" } : s === "offline" ? { color: "var(--color-danger)" } : { color: "var(--color-text-muted)" }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <div className="card">
          <div className="card-header">
            <ShieldAlert size={15} style={{ color: "var(--color-warning)" }} />
            <span>监控告警</span>
            <button onClick={() => setShowAdd(!showAdd)} className="btn btn-secondary ml-auto" style={{ padding: "4px 10px", fontSize: 12 }}>
              <Plus size={12} />添加
            </button>
          </div>
          {showAdd && (
            <div className="px-4 py-3 flex gap-2" style={{ borderBottom: "1px solid var(--color-border-light)" }}>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="名称" style={{ width: 120 }} />
              <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="input flex-1" placeholder="https://example.com" />
              <button onClick={handleAdd} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }}>确定</button>
            </div>
          )}
          <div className="card-body space-y-2">
            {monitors.length === 0 ? (
              <p className="text-center text-[13px] py-8" style={{ color: "var(--color-text-muted)" }}>暂无监控, 点击"添加"开始</p>
            ) : (
              monitors.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border-light)" }}>
                  <div className="flex items-center gap-3">
                    <Globe size={15} style={{ color: "var(--color-text-muted)" }} />
                    <div>
                      <div className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>{m.name}</div>
                      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{m.endpoint}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-medium" style={statusStyle(m.status)}>{m.status.toUpperCase()}</span>
                    <button onClick={async () => { await api.runHealthCheck(m.id); await load() }} className="btn btn-ghost" style={{ padding: 4 }}>
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {incidents.length > 0 && (
          <div className="card">
            <div className="card-header">
              <Activity size={15} style={{ color: "var(--color-danger)" }} />
              <span>活跃告警 ({incidents.length})</span>
            </div>
            <div className="card-body space-y-2">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-3 rounded-lg" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                  <div className="flex justify-between text-[12px]">
                    <span className="font-medium" style={{ color: "var(--color-danger)" }}>{inc.level}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>{inc.opened_at?.slice(0, 19)}</span>
                  </div>
                  <p className="text-[13px] mt-1" style={{ color: "var(--color-text-secondary)" }}>{inc.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
