import { useAppStore } from "#/stores/appStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEffect, useState } from "react"

export function StatusBar() {
  const isOnline = useDeviceStore((s) => s.isOnline)
  const backendOnline = useAppStore((s) => s.backendOnline)
  const activeChannel = useAppStore((s) => s.activeChannel)
  const [time, setTime] = useState("")

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }))
    }
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [])

  const channelNames: Record<string, string> = {
    bridge: "仪表盘", quest: "AI 任务", launch: "项目进度",
    terminal: "数据看板", watcher: "监控告警", signals: "留言消息",
    studio: "历史归档", device: "设备管理",
  }

  return (
    <header
      className="h-11 flex items-center justify-between px-5 shrink-0 select-none text-[13px]"
      style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span className="font-medium" style={{ color: "var(--color-text)" }}>
        {channelNames[activeChannel] ?? activeChannel}
      </span>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className={`status-dot ${backendOnline ? "online" : "offline"}`} />
          <span style={{ color: backendOnline ? "var(--color-text-secondary)" : "var(--color-text-muted)" }}>
            {backendOnline ? "引擎在线" : "引擎离线"}
          </span>
        </div>
        <span style={{ color: "var(--color-border)" }}>·</span>
        <div className="flex items-center gap-1.5">
          <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
          <span style={{ color: isOnline ? "var(--color-text-secondary)" : "var(--color-text-muted)" }}>
            {isOnline ? "设备在线" : "设备离线"}
          </span>
        </div>
        <span style={{ color: "var(--color-border)" }}>·</span>
        <span style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {time}
        </span>
      </div>
    </header>
  )
}
