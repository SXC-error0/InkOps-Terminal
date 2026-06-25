import { useState, useEffect } from "react"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import { useAppStore } from "#/stores/appStore"
import * as api from "#/lib/api"
import type { Device } from "#/lib/types"

// ── Data types ────────────────────────────────────────────────────

type DataSource = {
  id: string
  icon: string
  iconBg: string
  label: string
  sub: string
}

const DATA_SOURCES: DataSource[] = [
  { id: "github",  icon: "code",             iconBg: "bg-primary-container text-on-primary-container", label: "GitHub 提交",      sub: "InkOps/core" },
  { id: "server",  icon: "monitor_heart",    iconBg: "bg-tertiary-container text-on-tertiary-container", label: "服务器指标",    sub: "CPU/内存负载" },
  { id: "weather", icon: "partly_cloudy_day", iconBg: "bg-secondary-container text-on-secondary-container", label: "环境传感器 / 天气", sub: "本地 API" },
]

type ZoneId = "terminal" | "node_a"

const ZONES: Array<{ id: ZoneId; title: string; icon: string; variant: "default" | "active" }> = [
  { id: "terminal", title: '终端 4.2"',     icon: "desktop_windows", variant: "default" },
  { id: "node_a",   title: "节点_A (价签)", icon: "sell",            variant: "active" },
]

// ── Main Device Card ──────────────────────────────────────────────

function MainDeviceCard({
  device,
  onPush,
  loading,
}: {
  device: Device | null
  onPush: () => void
  loading: boolean
}) {
  const online = device?.status === "online"
  return (
    <div className="bento-card col-span-1 md:col-span-2 flex flex-col gap-0">
      <div className="flex justify-between items-start pb-4 mb-4 border-b border-outline-variant">
        <div>
          <span className="font-mono text-[11px] text-secondary tracking-widest uppercase block mb-1">主节点</span>
          <h3 className="font-display font-semibold text-primary text-xl">终端 4.2" 电子墨水屏</h3>
          <span className="font-mono text-[13px] text-on-surface-variant">
            {device ? `ESP8266 • ${device.ip ?? "未绑定"}` : "ESP8266 • 等待绑定"}
          </span>
        </div>
        <span
          className={`px-2 py-1 border font-mono text-[11px] flex items-center gap-1.5 ${
            online ? "border-secondary text-secondary" : "border-outline text-outline"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${online ? "bg-secondary" : "bg-outline"}`} />
          {online ? "在线" : "离线"}
        </span>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 aspect-video bg-surface-container border border-outline-variant relative flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: 40 }}>tablet</span>
            <span className="font-mono text-[11px]">电子墨水屏</span>
          </div>
          <div className="absolute bottom-2 left-2 bg-surface px-2 py-0.5 border border-outline font-mono text-[10px] uppercase">
            当前显示
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          {[
            { icon: "battery_5_bar",      label: "电池电量",  value: online ? "92%" : "--" },
            { icon: "signal_cellular_alt", label: "信号强度",  value: online ? "-45 dBm (强)" : "--" },
            { icon: "update",              label: "上次同步",  value: online ? "2分钟前" : "未同步" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between items-center border-b border-outline-variant pb-3">
              <span className="text-[14px] text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{r.icon}</span>
                {r.label}
              </span>
              <span className="font-mono text-[13px] text-primary font-semibold">{r.value}</span>
            </div>
          ))}
          <div className="mt-auto">
            <button
              onClick={onPush}
              disabled={!online || loading}
              className="w-full py-2 border border-outline text-on-surface text-[14px] hover:bg-surface-variant transition-colors disabled:opacity-40"
            >
              推送到设备
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small Device Card ─────────────────────────────────────────────

function SmallDeviceCard({
  nodeId, name, sub, battery, metric, metricLabel, status,
}: {
  nodeId: string; name: string; sub: string
  battery: string; metric: string; metricLabel: string
  status: "online" | "offline"
}) {
  const offline = status === "offline"
  return (
    <div className={`flex flex-col p-4 border ${offline ? "border-error opacity-80 bg-[#fffbfa]" : "border-outline-variant bg-surface-container-lowest"}`}>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-outline-variant">
        <span className={`font-mono text-[11px] tracking-widest uppercase ${offline ? "text-error" : "text-on-surface-variant"}`}>
          {nodeId}
        </span>
        <span className={`material-symbols-outlined text-[16px] ${offline ? "text-error" : "text-secondary"}`}>
          {offline ? "wifi_off" : "wifi"}
        </span>
      </div>
      <h3 className="font-display font-semibold text-primary text-base mb-1">{name}</h3>
      <span className="font-mono text-[13px] text-on-surface-variant mb-4">{sub}</span>
      <div className={`w-full h-24 border mb-4 flex items-center justify-center flex-col gap-1 ${offline ? "border-dashed border-outline bg-surface-container text-on-surface-variant" : "border-outline-variant bg-surface-container-high"}`}>
        {offline ? (
          <>
            <span className="material-symbols-outlined text-[24px] opacity-50">signal_disconnected</span>
            <span className="font-mono text-[10px]">无信号</span>
          </>
        ) : (
          <span className="material-symbols-outlined text-[32px] text-on-surface-variant">tablet_android</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-outline-variant">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] text-on-surface-variant">电池电量</span>
          <span className={`font-mono text-[13px] ${offline && parseInt(battery) < 20 ? "text-error" : "text-primary"}`}>{battery}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="font-mono text-[10px] text-on-surface-variant">{metricLabel}</span>
          <span className="font-mono text-[13px] text-primary">{metric}</span>
        </div>
      </div>
    </div>
  )
}

// ── Draggable Data Source Item ────────────────────────────────────

function DataSourceItem({
  source,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  source: DataSource
  isDragging: boolean
  onDragStart: (id: string) => void
  onDragEnd: () => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", source.id)
        e.dataTransfer.effectAllowed = "copy"
        onDragStart(source.id)
      }}
      onDragEnd={onDragEnd}
      className={`p-3 bg-surface border border-outline flex items-center justify-between select-none transition-all
        cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-40 scale-95 border-dashed" : "hover:border-primary hover:shadow-sm"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${source.iconBg}`}>
          <span className="material-symbols-outlined text-[16px]">{source.icon}</span>
        </div>
        <div>
          <span className="block font-medium text-primary text-[14px] leading-tight">{source.label}</span>
          <span className="font-mono text-[10px] text-on-surface-variant">{source.sub}</span>
        </div>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">drag_indicator</span>
    </div>
  )
}

// ── Drop Zone ─────────────────────────────────────────────────────

function DropZone({
  zone,
  dropped,
  isOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onClear,
}: {
  zone: typeof ZONES[number]
  dropped: DataSource | null
  isOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onClear: () => void
}) {
  const borderBase =
    zone.variant === "active"
      ? "border-secondary"
      : "border-outline-variant"
  const bgBase =
    zone.variant === "active"
      ? "bg-secondary-fixed"
      : "bg-surface-container-low"
  const titleColor =
    zone.variant === "active" ? "text-on-secondary-fixed" : "text-primary"

  return (
    <div
      className={`border-2 border-dashed p-4 flex flex-col min-h-[120px] transition-colors duration-150 ${
        isOver
          ? "border-primary bg-primary-container/20 scale-[1.01]"
          : `${borderBase} ${bgBase}`
      }`}
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={`font-mono font-semibold mb-2 flex items-center gap-2 text-[13px] ${titleColor}`}>
        <span className="material-symbols-outlined text-[16px]">{zone.icon}</span>
        {zone.title}
      </div>

      <div className="flex-1 border border-outline bg-surface p-2 flex items-center gap-2 min-h-[50px]">
        {dropped ? (
          <>
            <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${dropped.iconBg}`}>
              <span className="material-symbols-outlined text-[12px]">{dropped.icon}</span>
            </div>
            <span className="text-primary text-[12px] flex-1">{dropped.label}</span>
            <button
              onClick={onClear}
              title="移除绑定"
              className="shrink-0 text-outline hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className={`text-[12px] ${isOver ? "text-primary font-medium" : "text-outline"}`}>
              {isOver ? "释放以绑定" : "将数据源拖放到此处..."}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export function DevicePage() {
  const [device, setDevice] = useState<Device | null>(null)
  const [scanning, setScanning] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [ip, setIp] = useState("")
  const [binding, setBinding] = useState(false)
  const [showBind, setShowBind] = useState(false)

  // Dispatch rule state
  const [zoneSources, setZoneSources] = useState<Record<ZoneId, DataSource | null>>({
    terminal: DATA_SOURCES.find((s) => s.id === "server") ?? null,
    node_a: null,
  })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null)

  const addEvent = useEventStore((s) => s.addEvent)
  const showToast = useAppStore((s) => s.showToast)

  useEffect(() => {
    api.discoverDevices().then((d) => {
      if (d.length > 0) {
        setDevice(d[0])
        useDeviceStore.getState().setDevice(d[0])
        useDeviceStore.getState().setOnline(d[0].status === "online")
      }
    }).catch(() => {})
  }, [])

  const scan = async () => {
    setScanning(true)
    try {
      const d = await api.discoverDevices()
      if (d.length > 0) {
        setDevice(d[0])
        useDeviceStore.getState().setDevice(d[0])
        useDeviceStore.getState().setOnline(d[0].status === "online")
        addEvent({ type: "system", message: `发现设备: ${d[0].name}` })
        showToast(`已发现设备: ${d[0].name}`, "success")
      } else {
        addEvent({ type: "system", message: "未发现可绑定的局域网设备" })
        showToast("未发现可绑定设备", "info")
      }
    } catch {
      addEvent({ type: "alert", message: "局域网扫描失败" })
      showToast("设备扫描失败", "error")
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
      showToast(`设备 ${d.name} 绑定成功`, "success")
      setShowBind(false)
      setIp("")
    } catch (e) {
      addEvent({ type: "alert", message: `绑定失败: ${e}` })
      showToast("绑定失败，请检查 IP 地址", "error")
    } finally {
      setBinding(false)
    }
  }

  const handlePush = async () => {
    if (!device) return
    setActionLoading(true)
    try {
      const pages = await api.getPageHistory(1)
      if (pages[0]) {
        await api.pushPageToDevice(pages[0].id, device.id)
        addEvent({ type: "system", message: "已推送当前页面至设备" })
        showToast("已推送至设备", "success")
      }
    } catch {
      addEvent({ type: "alert", message: "推送失败" })
      showToast("推送失败", "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent, zoneId: ZoneId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setHoveredZone(zoneId)
  }

  const handleDragLeave = () => setHoveredZone(null)

  const handleDrop = (e: React.DragEvent, zoneId: ZoneId) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData("text/plain")
    const source = DATA_SOURCES.find((s) => s.id === sourceId)
    if (source) {
      setZoneSources((prev) => ({ ...prev, [zoneId]: source }))
      const zoneName = ZONES.find((z) => z.id === zoneId)?.title ?? zoneId
      addEvent({ type: "system", message: `已将「${source.label}」绑定到「${zoneName}」` })
      showToast(`${source.label} → ${zoneName}`, "success")
    }
    setHoveredZone(null)
    setDraggingId(null)
  }

  const clearZone = (zoneId: ZoneId) => {
    const prev = zoneSources[zoneId]
    if (prev) showToast(`已移除「${prev.label}」的绑定`, "info")
    setZoneSources((s) => ({ ...s, [zoneId]: null }))
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-8 max-w-7xl mx-auto space-y-8">

        {/* Section Header */}
        <div className="flex justify-between items-end border-b border-outline pb-4">
          <div>
            <h2 className="font-display font-bold text-primary text-[32px] leading-tight">设备拓扑与状态</h2>
            <p className="text-on-surface-variant mt-1 text-[16px]">管理并监控当前网络中的电子墨水节点。</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={scan}
              disabled={scanning}
              className="px-4 py-2 border border-outline text-on-surface text-[14px] flex items-center gap-2 hover:bg-surface-variant transition-colors bg-surface-container-lowest disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${scanning ? "animate-spin" : ""}`}>radar</span>
              扫描设备
            </button>
            <button
              onClick={() => setShowBind(true)}
              className="px-4 py-2 bg-primary text-on-primary text-[14px] flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              添加节点
            </button>
          </div>
        </div>

        {/* Bind Modal */}
        {showBind && (
          <div className="fixed inset-0 bg-primary/40 flex items-center justify-center z-50" onClick={() => setShowBind(false)}>
            <div className="bg-surface-container-lowest border border-outline-variant p-6 w-96" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display font-bold text-primary text-lg mb-4">手动绑定设备</h3>
              <label className="bento-label block mb-2">设备 IP 地址</label>
              <input
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && bind()}
                className="w-full bg-surface-container-lowest border-b-2 border-outline-variant focus:border-secondary font-mono text-[14px] px-3 py-2 outline-none mb-4 transition-colors"
                placeholder="例如: 192.168.1.100"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowBind(false)} className="flex-1 py-2 border border-outline text-on-surface hover:bg-surface-variant transition-colors text-[14px]">
                  取消
                </button>
                <button onClick={bind} disabled={!ip.trim() || binding} className="flex-1 py-2 bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 transition-opacity text-[14px]">
                  {binding ? "绑定中..." : "立即绑定"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Device Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MainDeviceCard device={device} onPush={handlePush} loading={actionLoading} />
          <SmallDeviceCard nodeId="节点_A" name='电子价签 2.13"' sub="BLE_MAC: E5:F6:G7" battery="88%" metric="-60 dBm" metricLabel="信号强度" status="online" />
          <SmallDeviceCard nodeId="节点_B" name='电子价签 2.13"' sub="BLE_MAC: H8:I9:J0" battery="12%" metric="2小时前" metricLabel="上次同步" status="offline" />
          <SmallDeviceCard nodeId="节点_C" name='会议室标牌 7.5"' sub="WIFI: K1:L2:M3" battery="60%" metric="-50 dBm" metricLabel="信号强度" status="online" />
        </div>

        {/* Dispatch Rules */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[24px]">route</span>
            <h2 className="font-display font-bold text-primary text-[24px]">分发规则</h2>
            <span className="font-mono text-[11px] text-on-surface-variant ml-2">— 拖拽数据源绑定目标节点</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Data Sources (draggable) */}
            <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-5">
              <div className="font-mono text-[11px] text-on-surface-variant mb-4 pb-2 border-b border-outline-variant uppercase tracking-wider flex justify-between">
                <span>数据源</span>
                <span className="normal-case text-[11px] text-outline">可拖拽</span>
              </div>
              <div className="flex flex-col gap-3">
                {DATA_SOURCES.map((src) => (
                  <DataSourceItem
                    key={src.id}
                    source={src}
                    isDragging={draggingId === src.id}
                    onDragStart={(id) => setDraggingId(id)}
                    onDragEnd={() => setDraggingId(null)}
                  />
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex lg:col-span-1 items-center justify-center text-outline-variant pt-8">
              <span className="material-symbols-outlined text-[48px]">arrow_right_alt</span>
            </div>

            {/* Target Canvas (drop zones) */}
            <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 min-h-[260px]">
              <div className="font-mono text-[11px] text-on-surface-variant mb-4 pb-2 border-b border-outline-variant uppercase tracking-wider flex justify-between items-center">
                <span>目标节点</span>
                {draggingId && (
                  <span className="text-primary text-[11px] normal-case animate-pulse">
                    拖拽到目标节点以绑定...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ZONES.map((zone) => (
                  <DropZone
                    key={zone.id}
                    zone={zone}
                    dropped={zoneSources[zone.id]}
                    isOver={hoveredZone === zone.id}
                    onDragOver={(e) => handleDragOver(e, zone.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, zone.id)}
                    onClear={() => clearZone(zone.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
