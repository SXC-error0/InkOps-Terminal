import { useAppStore } from "#/stores/appStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEffect, useState } from "react"

const names: Record<string, string> = {
  bridge: "仪表盘", quest: "AI 任务", launch: "项目进度",
  terminal: "数据看板", watcher: "监控告警", signals: "留言消息",
  studio: "历史归档", device: "设备管理",
}

export function StatusBar() {
  const channel = useAppStore((s) => s.activeChannel)
  const backend = useAppStore((s) => s.backendOnline)
  const device = useDeviceStore((s) => s.isOnline)
  const [time, setTime] = useState("")
  useEffect(() => { const t = () => setTime(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })); t(); const i = setInterval(t, 10000); return () => clearInterval(i) }, [])

  return (
    <header className="flex items-center justify-between h-11 px-5 shrink-0 select-none bg-white border-b border-ink-200">
      <span className="text-[13px] font-semibold text-ink-700">{names[channel] ?? channel}</span>
      <div className="flex items-center gap-4">
        <Dot ok={backend} label="引擎" />
        <Dot ok={device} label="设备" />
        <span className="text-xs font-mono tabular-nums text-ink-400">{time}</span>
      </div>
    </header>
  )
}

function Dot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px]">
      <span className={`size-2 rounded-full ${ok ? "bg-success" : "bg-ink-300"}`} />
      <span className={ok ? "text-ink-500" : "text-ink-300"}>{label}{ok ? "在线" : "离线"}</span>
    </div>
  )
}
