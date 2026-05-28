import { useEventStore } from "#/stores/eventStore"

const iconMap: Record<string, string> = {
  system:  "●",
  quest:   "◆",
  alert:   "▲",
  message: "◇",
  launch:  "▶",
  commit:  "■",
}
const colorMap: Record<string, string> = {
  system:  "var(--color-text-muted)",
  quest:   "var(--color-purple)",
  alert:   "var(--color-danger)",
  message: "var(--color-warning)",
  launch:  "var(--color-accent)",
  commit:  "var(--color-success)",
}

export function EventStream() {
  const events = useEventStore((s) => s.events)

  if (events.length === 0) {
    return (
      <div className="p-4 text-center text-[12px]" style={{ color: "var(--color-text-muted)" }}>
        暂无事件
      </div>
    )
  }

  return (
    <div className="divide-y" style={{ borderColor: "var(--color-border-light)" }}>
      {events.slice(0, 15).map((evt) => (
        <div key={evt.id} className="flex items-start gap-2.5 px-4 py-2 text-[12px] animate-fade-in">
          <span style={{ color: colorMap[evt.type] ?? "var(--color-text-muted)", flexShrink: 0 }}>
            {iconMap[evt.type] ?? "●"}
          </span>
          <span className="flex-1 truncate" style={{ color: "var(--color-text-secondary)" }}>
            {evt.message}
          </span>
          <span
            className="text-[10px] shrink-0"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {evt.timestamp?.slice(11, 16) ?? ""}
          </span>
        </div>
      ))}
    </div>
  )
}
