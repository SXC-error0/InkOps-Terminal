import { useState } from "react"
import { Cpu, Wifi, RefreshCw } from "lucide-react"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"
import type { Device } from "#/lib/types"

export function DevicePage() {
  const [device, setDevice] = useState<Device | null>(null)
  const [scanning, setScanning] = useState(false)
  const [ip, setIp] = useState("")
  const [binding, setBinding] = useState(false)
  const addEvent = useEventStore((s) => s.addEvent)

  const handleScan = async () => {
    setScanning(true)
    try {
      const devices = await api.discoverDevices()
      if (devices.length > 0) {
        setDevice(devices[0])
        useDeviceStore.getState().setDevice(devices[0])
        useDeviceStore.getState().setOnline(devices[0].status === "online")
        addEvent({ type: "system", message: `发现设备: ${devices[0].name}` })
      } else {
        addEvent({ type: "system", message: "未发现设备" })
      }
    } catch { addEvent({ type: "system", message: "扫描失败" }) } finally { setScanning(false) }
  }

  const handleBind = async () => {
    if (!ip.trim()) return; setBinding(true)
    try {
      const d = await api.bindDevice({ name: "NODE-01", ip })
      setDevice(d); useDeviceStore.getState().setDevice(d); useDeviceStore.getState().setOnline(true)
      addEvent({ type: "system", message: `绑定成功: ${d.name} @ ${ip}` })
    } catch (e) { addEvent({ type: "alert", message: `绑定失败: ${e}` }) } finally { setBinding(false) }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-sm mx-auto p-6 space-y-4">
        <div className="card">
          <div className="card-header">
            <Cpu size={15} style={{ color: "var(--color-info)" }} />
            <span>设备管理</span>
          </div>
          <div className="card-body text-center">
            {device ? (
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: "#e0e7ff" }}>
                  <Cpu size={22} style={{ color: "var(--color-info)" }} />
                </div>
                <div className="space-y-2 text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>
                  {[{ l: "名称", v: device.name }, { l: "IP", v: device.ip ?? "--" }, { l: "型号", v: device.model }].map(({ l, v }) => (
                    <div key={l} className="flex justify-between">
                      <span style={{ color: "var(--color-text-muted)" }}>{l}</span>
                      <span style={{ color: "var(--color-text)" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="status-dot" style={{ background: device.status === "online" ? "var(--color-success)" : "var(--color-text-muted)" }} />
                  <span className="text-[12px]" style={{ color: device.status === "online" ? "var(--color-success)" : "var(--color-text-muted)" }}>
                    {device.status === "online" ? "在线" : "离线"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8">
                <Wifi size={36} className={`mx-auto mb-3 ${scanning ? "animate-pulse" : ""}`} style={{ color: "var(--color-text-muted)", opacity: 0.3 }} />
                <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>{scanning ? "扫描中..." : "未发现设备"}</p>
                <p className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>确保 ESP8266 与上位机在同一网络</p>
              </div>
            )}
            <button onClick={handleScan} disabled={scanning} className="btn btn-secondary w-full mt-4">
              <RefreshCw size={12} className={scanning ? "animate-spin" : ""} />
              {scanning ? "搜索中..." : "重新搜索"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body space-y-3">
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>手动绑定设备 IP</p>
            <div className="flex gap-2">
              <input value={ip} onChange={(e) => setIp(e.target.value)} className="input flex-1" placeholder="192.168.10.211" />
              <button onClick={handleBind} disabled={!ip.trim() || binding} className="btn btn-primary">{binding ? "..." : "连接"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
