import { useAppStore } from "#/stores/appStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEffect, useState } from "react"
import { PanelRight } from "lucide-react"

const names: Record<string, string> = {
  bridge: "仪表盘", quest: "AI 任务", launch: "项目进度",
  terminal: "数据看板", watcher: "监控告警", signals: "留言消息",
  studio: "历史归档", device: "设备管理",
}

export function StatusBar() {
  const channel = useAppStore((s) => s.activeChannel)
  const backend = useAppStore((s) => s.backendOnline)
  const device = useDeviceStore((s) => s.isOnline)
  const isPreviewPanelOpen = useAppStore((s) => s.isPreviewPanelOpen)
  const togglePreviewPanel = useAppStore((s) => s.togglePreviewPanel)
  const [time, setTime] = useState("")
  
  useEffect(() => { const t = () => setTime(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })); t(); const i = setInterval(t, 10000); return () => clearInterval(i) }, [])

  return (
    <header className="flex items-center justify-between h-11 px-5 shrink-0 select-none bg-sidebar-bg/50 backdrop-blur-md border-b border-ink-150 relative z-20">
      <span className="text-[12px] font-bold font-mono tracking-widest text-ink-700 uppercase">
        // {names[channel] ?? channel}
      </span>
      <div className="flex items-center gap-5">
        <Dot ok={backend} label="ENGINE" />
        <Dot ok={device} label="DISPLAY" />
        <span className="text-[11px] font-mono tracking-widest text-accent-strong bg-accent-glow px-2 py-0.5 rounded border border-accent/20 tabular-nums">{time}</span>
        
        <button
          onClick={togglePreviewPanel}
          title={isPreviewPanelOpen ? "隐藏设备面板" : "显示设备面板"}
          className={`flex items-center justify-center size-7 rounded cursor-pointer transition-all duration-150 border ${
            isPreviewPanelOpen
              ? "text-accent bg-accent/5 border-accent/20 hover:bg-accent/10"
              : "text-ink-400 bg-transparent border-ink-150 hover:text-ink-600 hover:border-ink-200"
          }`}
        >
          <PanelRight size={14} />
        </button>
      </div>
    </header>
  )
}

function Dot({ ok, label }: { ok: boolean; label: string }) {
  const displayLabel = label === "ENGINE" ? "引擎" : "显示"
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider">
      <span className="relative flex size-1.5">
        {ok && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full size-1.5 ${ok ? "bg-success" : "bg-ink-300"}`} />
      </span>
      <span className={ok ? "text-ink-600 font-medium" : "text-ink-300"}>{displayLabel} // {ok ? "在线" : "离线"}</span>
    </div>
  )
}
