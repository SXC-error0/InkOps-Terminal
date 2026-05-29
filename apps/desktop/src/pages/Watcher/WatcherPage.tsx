import { useState, useEffect } from "react"
import { ShieldAlert, Globe, Plus, RefreshCw, Activity } from "lucide-react"
import * as api from "#/lib/api"

interface M { id: string; name: string; target_type: string; endpoint: string; status: string }
interface I { id: string; monitor_id: string; level: string; summary: string; opened_at: string }

export function WatcherPage() {
  const [mons, setMons] = useState<M[]>([]); const [incs, setIncs] = useState<I[]>([]); const [show, setShow] = useState(false); const [nm, setNm] = useState(""); const [ep, setEp] = useState("")
  const load = async () => { try { const [m, i] = await Promise.all([api.getMonitors() as Promise<M[]>, api.getActiveIncidents() as Promise<I[]>]); setMons(m); setIncs(i) } catch { /* */ } }
  useEffect(() => { load() }, [])
  const add = async () => { if (!nm || !ep) return; await api.createMonitor({ name: nm, target_type: "http", endpoint: ep }); setShow(false); setNm(""); setEp(""); await load() }

  return (
    <div className="h-full overflow-auto"><div className="p-6"><div className="max-w-xl mx-auto space-y-4">
      <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none"><ShieldAlert size={15} className="text-warning" />监控告警<button onClick={() => setShow(!show)} className="ml-auto inline-flex items-center justify-center h-7 px-2.5 text-xs font-medium rounded text-ink-400 hover:bg-ink-50 hover:text-ink-500 transition-colors"><Plus size={11} />添加</button></div>
        {show && <div className="px-4 py-3 flex gap-2 border-b border-ink-100"><input value={nm} onChange={(e) => setNm(e.target.value)} className="w-full h-[34px] px-2.5 text-sm font-sans text-ink-600 bg-white border border-ink-200 rounded placeholder:text-ink-300 focus:border-accent focus:ring-3 focus:ring-accent-light outline-none transition-all" placeholder="名称" style={{ width: 130 }} /><input value={ep} onChange={(e) => setEp(e.target.value)} className="w-full h-[34px] px-2.5 text-sm font-sans text-ink-600 bg-white border border-ink-200 rounded placeholder:text-ink-300 focus:border-accent focus:ring-3 focus:ring-accent-light outline-none transition-all flex-1" placeholder="https://example.com" /><button onClick={add} className="inline-flex items-center justify-center h-7 px-2.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent-strong transition-colors">确定</button></div>}
        <div className="p-4 space-y-1.5">
          {mons.length === 0 ? <div className="flex flex-col items-center py-12 text-center"><div className="size-10 rounded-full bg-ink-50 flex items-center justify-center mb-3"><Globe size={20} className="text-ink-200" /></div><h3 className="text-sm font-medium text-ink-500">暂无监控</h3><p className="text-xs text-ink-400 mt-1">点击添加开始</p></div> : mons.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3 rounded-md bg-ink-50 border border-ink-100 hover:bg-ink-100 transition-colors duration-100">
              <div className="flex items-center gap-3 min-w-0"><Globe size={15} className="text-ink-400 shrink-0" /><div className="min-w-0"><div className="text-[13px] font-medium text-ink-600 truncate">{m.name}</div><div className="text-[11px] text-ink-400 truncate mt-0.5">{m.endpoint}</div></div></div>
              <div className="flex items-center gap-3 shrink-0"><span className={`text-xs font-medium ${m.status === "online" ? "text-success" : "text-danger"}`}>{m.status.toUpperCase()}</span><button onClick={async () => { await api.runHealthCheck(m.id); await load() }} className="inline-flex items-center justify-center size-7 rounded text-ink-400 hover:bg-ink-50 hover:text-ink-500 transition-colors"><RefreshCw size={12} /></button></div>
            </div>
          ))}
        </div>
      </div>
      {incs.length > 0 && (
        <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none"><Activity size={15} className="text-danger" />活跃告警 ({incs.length})</div>
          <div className="p-4 space-y-2">{incs.map((inc) => (
            <div key={inc.id} className="flex items-start gap-2.5 p-3 rounded-md bg-danger-light/50 border border-danger-light text-[13px]"><div><div className="flex justify-between text-xs"><span className="font-medium text-danger">{inc.level}</span><span className="text-ink-400">{inc.opened_at?.slice(0, 19)}</span></div><p className="text-ink-500 mt-1">{inc.summary}</p></div></div>
          ))}</div>
        </div>
      )}
    </div></div></div>
  )
}
