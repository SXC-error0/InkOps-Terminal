import { useAppStore } from "#/stores/appStore"
import { useDeviceStore } from "#/stores/deviceStore"
import type { ChannelDef, Channel } from "#/lib/types"
import { LayoutDashboard, Sparkles, Rocket, Monitor, ShieldAlert, MessageSquare, Archive, Cpu } from "lucide-react"

const items: (ChannelDef & { icon: typeof LayoutDashboard })[] = [
  { id: "bridge",   label: "仪表盘",   shortcut: "1", icon: LayoutDashboard },
  { id: "quest",    label: "AI 任务",  shortcut: "2", icon: Sparkles },
  { id: "launch",   label: "项目进度", shortcut: "3", icon: Rocket },
  { id: "terminal", label: "数据看板", shortcut: "4", icon: Monitor },
  { id: "watcher",  label: "监控告警", shortcut: "5", icon: ShieldAlert },
  { id: "signals",  label: "留言消息", shortcut: "6", icon: MessageSquare },
  { id: "studio",   label: "历史归档", shortcut: "7", icon: Archive },
  { id: "device",   label: "设备管理", shortcut: "8", icon: Cpu },
]

export function Sidebar() {
  const active = useAppStore((s) => s.activeChannel)
  const setActive = useAppStore((s) => s.setActiveChannel)
  const online = useDeviceStore((s) => s.isOnline)

  return (
    <aside className="flex flex-col shrink-0 select-none w-55 bg-sidebar-bg">
      <div className="flex items-center gap-2.5 h-12 px-4 border-b border-sidebar-border shrink-0">
        <div className="size-6 rounded-md flex items-center justify-center shrink-0 bg-accent">
          <span className="text-[10px] font-bold text-white">I</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-text-active">InkOps</span>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {items.map((it) => {
          const sel = active === it.id
          const Icon = it.icon
          return (
            <button
              key={it.id}
              onClick={() => setActive(it.id as Channel)}
              className={`w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-left text-sm transition-colors duration-100
                ${sel ? "font-semibold text-sidebar-text-active bg-sidebar-active" : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"}`}
            >
              <Icon size={16} className={`shrink-0 ${sel ? "text-accent" : "opacity-60"}`} />
              <span className="flex-1 truncate">{it.label}</span>
              <kbd className={`text-[10px] font-mono ${sel ? "opacity-60" : "opacity-40"}`}>⌃{it.shortcut}</kbd>
            </button>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border text-[11px] text-sidebar-text shrink-0">
        <div className="flex items-center gap-2">
          <span className={`inline-block size-2 rounded-full ${online ? "bg-success" : "bg-ink-300"}`} />
          <span>{online ? "NODE-01 在线" : "设备未连接"}</span>
        </div>
      </div>
    </aside>
  )
}
