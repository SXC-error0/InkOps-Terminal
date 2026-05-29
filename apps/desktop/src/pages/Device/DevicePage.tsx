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

  const scan = async () => {
    setScanning(true)
    try {
      const d = await api.discoverDevices()
      if (d.length > 0) {
        setDevice(d[0])
        useDeviceStore.getState().setDevice(d[0])
        useDeviceStore.getState().setOnline(d[0].status === "online")
        addEvent({ type: "system", message: `发现设备: ${d[0].name}` })
      } else {
        addEvent({ type: "system", message: "未发现可绑定的局域网设备" })
      }
    } catch {
      addEvent({ type: "system", message: "局域网扫描失败" })
    } finally {
      setScanning(false)
    }
  }

  const bind = async () => {
    if (!ip.trim()) return
    setBinding(true)
    try {
      const d = await api.bindDevice({ name: "NODE-01", ip })
      setDevice(d)
      useDeviceStore.getState().setDevice(d)
      useDeviceStore.getState().setOnline(true)
      addEvent({ type: "system", message: `绑定设备: ${d.name}` })
    } catch (e) {
      addEvent({ type: "alert", message: `绑定失败: ${e}` })
    } finally {
      setBinding(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Title and description */}
        <div className="flex flex-col gap-1 border-b border-ink-100 pb-4">
          <h1 className="text-xs font-mono font-bold tracking-widest text-ink-700 uppercase">
            // 物理墨水屏设备管理器
          </h1>
          <p className="text-[11px] text-ink-400 font-sans">
            扫描并绑定局域网内的 ESP8266 电子墨水屏物理硬件节点，管理其连接状态与屏幕参数。
          </p>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Discover & Bind (width 6/12) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Discover Control Card */}
            <div className="cyber-card rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50 select-none">
                <Cpu size={13} className="text-purple" />
                自动设备扫描
              </div>
              <div className="p-5 text-center">
                <div className="relative mx-auto mb-4 size-16 flex items-center justify-center rounded-full bg-ink-50 border border-ink-100">
                  <Wifi size={28} className={`text-ink-300 ${scanning ? "animate-pulse" : ""}`} />
                  {scanning && (
                    <div className="absolute inset-0 rounded-full border border-accent animate-ping opacity-25" />
                  )}
                </div>
                <h3 className="text-xs font-semibold text-ink-700 uppercase font-mono tracking-wider">
                  {scanning ? "正在扫描局域网..." : "自动设备发现"}
                </h3>
                <p className="text-[10px] text-ink-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  请确认您的 ESP8266 墨水屏设备已通电并已连接到相同的局域网段。
                </p>
                
                <button 
                  onClick={scan} 
                  disabled={scanning} 
                  className="inline-flex items-center justify-center gap-1.5 w-full h-9 mt-4 px-3.5 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-ink-50 text-ink-600 border border-ink-200 hover:bg-ink-150 hover:border-accent/40 transition-all duration-200"
                >
                  <RefreshCw size={11} className={scanning ? "animate-spin" : ""} />
                  {scanning ? "扫描发现中..." : "开始自动扫描"}
                </button>
              </div>
            </div>

            {/* Manual Bind Card */}
            <div className="cyber-card rounded-lg overflow-hidden">
              <div className="p-5 space-y-3.5">
                <p className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-widest">手动 IP 地址绑定</p>
                <div className="flex gap-2.5">
                  <input 
                    value={ip} 
                    onChange={(e) => setIp(e.target.value)} 
                    className="h-9 px-3 text-xs font-mono rounded outline-none flex-1" 
                    placeholder="例如: 192.168.1.100" 
                  />
                  <button 
                    onClick={bind} 
                    disabled={!ip.trim() || binding} 
                    className="inline-flex items-center justify-center h-9 px-5 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong disabled:opacity-30 transition-all duration-150"
                  >
                    {binding ? "正在绑定" : "立即绑定"}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Device Status Details (width 6/12) */}
          <div className="lg:col-span-6 space-y-6">
            {device ? (
              <div className="cyber-card rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50 select-none">
                  <Cpu size={13} className="text-accent" />
                  设备运行指标与状态
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="bg-ink-50 border border-ink-100 rounded p-4 font-mono text-xs space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400 font-bold uppercase">设备名称</span>
                      <span className="text-ink-700 font-bold">{device.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400 font-bold uppercase">IP 地址</span>
                      <span className="text-ink-650">{device.ip ?? "--"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400 font-bold uppercase">规格型号</span>
                      <span className="text-ink-650">{device.model}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400 font-bold uppercase">连接状态</span>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex size-2">
                          {device.status === "online" && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                          )}
                          <span className={`relative inline-flex rounded-full size-2 ${device.status === "online" ? "bg-success" : "bg-ink-300"}`} />
                        </span>
                        <span className={`font-bold ${device.status === "online" ? "text-success" : "text-ink-400"}`}>
                          {device.status === "online" ? "在线" : "离线"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="cyber-card rounded-lg overflow-hidden flex flex-col justify-center items-center p-8 text-center min-h-[300px] select-none">
                <div className="size-11 rounded-full bg-ink-50/80 flex items-center justify-center border border-ink-100 mb-4">
                  <Wifi size={20} className="text-ink-300" />
                </div>
                <h3 className="text-xs font-semibold text-ink-700 uppercase font-mono tracking-widest">等待设备绑定</h3>
                <p className="text-[11px] text-ink-400 mt-1.5 max-w-xs leading-relaxed">
                  请在左侧区域扫描并发现局域网内的 ESP8266 墨水屏物理节点，或直接手动输入其 IP 地址进行绑定连接。
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
