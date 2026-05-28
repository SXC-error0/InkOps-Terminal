import { useAppStore } from "#/stores/appStore"
import { useDeviceStore } from "#/stores/deviceStore"
import type { ChannelDef, Channel } from "#/lib/types"
import {
  Radio, ScrollText, Rocket, Terminal,
  ShieldAlert, MessageSquare, Palette, Cpu,
} from "lucide-react"

const channels: (ChannelDef & { icon: typeof Radio })[] = [
  { id: "bridge", label: "仪表盘", shortcut: "1", icon: Radio },
  { id: "quest", label: "AI 任务", shortcut: "2", icon: ScrollText },
  { id: "launch", label: "项目进度", shortcut: "3", icon: Rocket },
  { id: "terminal", label: "数据看板", shortcut: "4", icon: Terminal },
  { id: "watcher", label: "监控告警", shortcut: "5", icon: ShieldAlert },
  { id: "signals", label: "留言消息", shortcut: "6", icon: MessageSquare },
  { id: "studio", label: "历史归档", shortcut: "7", icon: Palette },
  { id: "device", label: "设备管理", shortcut: "8", icon: Cpu },
]

export function Sidebar() {
  const activeChannel = useAppStore((s) => s.activeChannel)
  const setActiveChannel = useAppStore((s) => s.setActiveChannel)
  const isOnline = useDeviceStore((s) => s.isOnline)

  return (
    <aside
      className="flex flex-col w-48 shrink-0 select-none"
      style={{ background: "var(--color-sidebar)" }}
    >
      {/* Logo */}
      <div
        className="h-12 flex items-center gap-2.5 px-4 shrink-0"
        style={{ borderBottom: "1px solid var(--color-sidebar-border)" }}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: "var(--color-accent)" }}
        >
          <span className="text-[10px] font-bold text-white">I</span>
        </div>
        <span
          className="text-sm font-semibold tracking-tight"
          style={{ color: "var(--color-sidebar-text-active)" }}
        >
          InkOps
        </span>
      </div>

      {/* 导航 */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {channels.map((ch) => {
          const isActive = activeChannel === ch.id
          const Icon = ch.icon

          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id as Channel)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left
                         transition-colors duration-100 text-[13px]"
              style={{
                background: isActive ? "var(--color-sidebar-active)" : "transparent",
                color: isActive ? "var(--color-sidebar-text-active)" : "var(--color-sidebar-text)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--color-sidebar-hover)"
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent"
              }}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1 truncate">{ch.label}</span>
              <kbd
                className="text-[10px] font-mono opacity-50"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ⌃{ch.shortcut}
              </kbd>
            </button>
          )
        })}
      </nav>

      {/* 底部设备状态 */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--color-sidebar-border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="status-dot"
            style={{
              background: isOnline ? "var(--color-success)" : "#475569",
            }}
          />
          <span className="text-[11px] truncate" style={{ color: "var(--color-sidebar-text)" }}>
            {isOnline ? "NODE-01 在线" : "设备未连接"}
          </span>
        </div>
      </div>
    </aside>
  )
}
