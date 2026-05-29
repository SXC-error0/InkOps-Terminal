import { useState } from "react"
import { Cpu, Wifi, RefreshCw } from "lucide-react"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"
import type { Device } from "#/lib/types"

export function DevicePage() {
  const [device, setDevice] = useState<Device | null>(null); const [scanning, setScanning] = useState(false)
  const [ip, setIp] = useState(""); const [binding, setBinding] = useState(false)
  const addEvent = useEventStore((s) => s.addEvent)
  const scan = async () => { setScanning(true); try { const d = await api.discoverDevices(); if (d.length > 0) { setDevice(d[0]); useDeviceStore.getState().setDevice(d[0]); useDeviceStore.getState().setOnline(d[0].status === "online"); addEvent({ type: "system", message: `发现: ${d[0].name}` }) } else { addEvent({ type: "system", message: "未发现设备" }) } } catch { addEvent({ type: "system", message: "扫描失败" }) } finally { setScanning(false) } }
  const bind = async () => { if (!ip.trim()) return; setBinding(true); try { const d = await api.bindDevice({ name: "NODE-01", ip }); setDevice(d); useDeviceStore.getState().setDevice(d); useDeviceStore.getState().setOnline(true); addEvent({ type: "system", message: `绑定: ${d.name}` }) } catch (e) { addEvent({ type: "alert", message: `失败: ${e}` }) } finally { setBinding(false) } }

  return (
    <div className="h-full overflow-auto"><div className="p-6"><div className="max-w-xs mx-auto space-y-3">
      <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none"><Cpu size={15} className="text-purple" />设备管理</div>
        <div className="p-5 text-center">
          {device ? (
            <div className="space-y-4">
              <div className="size-11 mx-auto rounded-full bg-purple-light flex items-center justify-center"><Cpu size={20} className="text-purple" /></div>
              <div className="bg-ink-50 border border-ink-100 rounded-md p-4 font-mono text-xs space-y-2 text-left">{[{ l: "名称", v: device.name }, { l: "IP", v: device.ip ?? "--" }, { l: "型号", v: device.model }].map(({ l, v }) => <div key={l} className="flex justify-between"><span className="text-ink-400">{l}</span><span className="text-ink-600">{v}</span></div>)}</div>
              <div className="flex items-center justify-center gap-2"><span className={`size-2 rounded-full ${device.status === "online" ? "bg-success" : "bg-ink-300"}`} /><span className={`text-xs ${device.status === "online" ? "text-success" : "text-ink-400"}`}>{device.status === "online" ? "在线" : "离线"}</span></div>
            </div>
          ) : (
            <div className="py-10"><Wifi size={32} className={`mx-auto mb-3 text-ink-200 ${scanning ? "animate-pulse" : ""}`} /><p className="text-sm text-ink-400">{scanning ? "扫描中..." : "未发现设备"}</p><p className="text-xs text-ink-300 mt-1">确保 ESP8266 在同一网络</p></div>
          )}
          <button onClick={scan} disabled={scanning} className="inline-flex items-center justify-center gap-1.5 w-full h-[34px] mt-4 px-3.5 text-sm font-medium rounded cursor-pointer select-none bg-white text-ink-500 border border-ink-200 hover:bg-ink-50 transition-colors"><RefreshCw size={12} className={scanning ? "animate-spin" : ""} />{scanning ? "搜索中..." : "重新搜索"}</button>
        </div>
      </div>
      <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden"><div className="p-5 space-y-3"><p className="text-xs text-ink-400">手动绑定</p><div className="flex gap-2"><input value={ip} onChange={(e) => setIp(e.target.value)} className="w-full h-[34px] px-2.5 text-sm font-sans text-ink-600 bg-white border border-ink-200 rounded placeholder:text-ink-300 focus:border-accent focus:ring-3 focus:ring-accent-light outline-none transition-all flex-1" placeholder="192.168.10.211" /><button onClick={bind} disabled={!ip.trim() || binding} className="inline-flex items-center justify-center h-7 px-2.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent-strong disabled:opacity-35 transition-colors">{binding ? "..." : "连接"}</button></div></div></div>
    </div></div></div>
  )
}
