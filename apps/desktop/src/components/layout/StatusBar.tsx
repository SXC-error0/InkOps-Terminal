import { useAppStore } from "#/stores/appStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEffect, useState } from "react"

const names: Record<string, string> = {
  bridge: "仪表盘",
  quest: "内容实验室",
  launch: "项目执行",
  terminal: "系统状态",
  watcher: "归档",
  signals: "生活中心",
  studio: "时间线",
  device: "设备管理",
}

export function StatusBar() {
  const channel = useAppStore((s) => s.activeChannel)
  const backend = useAppStore((s) => s.backendOnline)
  const device = useDeviceStore((s) => s.isOnline)
  const isPreviewPanelOpen = useAppStore((s) => s.isPreviewPanelOpen)
  const togglePreviewPanel = useAppStore((s) => s.togglePreviewPanel)
  const [time, setTime] = useState("")

  useEffect(() => {
    const t = () =>
      setTime(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }))
    t()
    const i = setInterval(t, 10000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="flex items-center justify-between h-10 px-5 shrink-0 select-none bg-surface border-b border-outline-variant relative z-20">
      <span className="text-[13px] font-medium text-on-surface-variant">
        {names[channel] ?? channel}
      </span>
      <div className="flex items-center gap-4">
        <StatusDot ok={backend} label="引擎" />
        <StatusDot ok={device} label="显示屏" />
        <span className="font-mono text-[13px] text-on-surface tabular-nums">{time}</span>
        <button
          onClick={togglePreviewPanel}
          title={isPreviewPanelOpen ? "隐藏设备面板" : "显示设备面板"}
          className={`flex items-center justify-center w-7 h-7 transition-colors ${
            isPreviewPanelOpen
              ? "text-secondary bg-secondary-container/30"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>side_navigation</span>
        </button>
      </div>
    </div>
  )
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono">
      <span className="relative flex w-1.5 h-1.5">
        {ok && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />}
        <span className={`relative inline-flex rounded-full w-1.5 h-1.5 ${ok ? "bg-secondary" : "bg-outline"}`} />
      </span>
      <span className={ok ? "text-on-surface-variant" : "text-outline"}>
        {label}
      </span>
    </div>
  )
}
