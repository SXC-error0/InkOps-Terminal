import { useAppStore } from "#/stores/appStore"
import { useDeviceStore } from "#/stores/deviceStore"
import type { ChannelDef, Channel } from "#/lib/types"
import { LayoutDashboard, Sparkles, Rocket, Monitor, ShieldAlert, MessageSquare, Archive, Cpu, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

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
  const isCollapsed = useAppStore((s) => s.isSidebarCollapsed)
  const toggleCollapse = useAppStore((s) => s.toggleSidebar)
  const online = useDeviceStore((s) => s.isOnline)

  return (
    <aside
      className={`flex flex-col shrink-0 select-none bg-sidebar-bg border-r border-sidebar-border relative z-10 transition-[width] duration-200 ease-in-out ${
        isCollapsed ? "w-14" : "w-55"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center h-12 px-3 border-b border-sidebar-border shrink-0 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="size-6 rounded-md flex items-center justify-center shrink-0 bg-gradient-to-br from-accent to-accent-light shadow-md shadow-accent/20">
                <span className="text-[11px] font-bold text-white tracking-widest font-mono">IO</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-wider text-sidebar-text-active font-mono uppercase">InkOps</span>
                <span className="text-[9px] font-mono tracking-widest text-sidebar-text/50 uppercase leading-none mt-0.5">控制台</span>
              </div>
            </div>
            <button
              onClick={toggleCollapse}
              className="flex items-center justify-center size-6 rounded hover:bg-ink-100 hover:text-ink-700 text-ink-400 cursor-pointer transition-colors duration-150 shrink-0"
              title="折叠侧边栏"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-center size-8 rounded border border-ink-150 bg-ink-50/20 hover:bg-ink-100 hover:text-ink-700 text-ink-400 cursor-pointer transition-colors duration-150 shrink-0"
            title="展开侧边栏"
          >
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-3 px-2 space-y-1 overflow-y-auto ${isCollapsed ? "px-1.5" : "px-2"}`}>
        {items.map((it) => {
          const sel = active === it.id
          const Icon = it.icon
          return (
            <button
              key={it.id}
              onClick={() => setActive(it.id as Channel)}
              title={isCollapsed ? it.label : undefined}
              className={`w-full relative flex items-center group outline-none transition-colors duration-150 cursor-pointer h-9
                ${isCollapsed ? "justify-center px-0 rounded-md" : "gap-2.5 px-3 rounded-md text-left"}
                ${sel ? "font-semibold text-sidebar-text-active" : "text-sidebar-text hover:text-sidebar-text-active"}`}
            >
              {sel && (
                <motion.span
                  layoutId="active-nav"
                  className="absolute inset-0 bg-sidebar-active border-l-2 border-accent rounded-md"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={15} className={`shrink-0 z-10 transition-transform duration-200 group-hover:scale-105 ${sel ? "text-accent-strong" : "opacity-50 group-hover:opacity-100"}`} />
              {!isCollapsed && <span className="flex-1 truncate z-10 text-[13px]">{it.label}</span>}
              {!isCollapsed && (
                <kbd className={`text-[9px] font-mono border border-sidebar-border px-1 py-0.5 rounded-sm shrink-0 z-10 transition-opacity duration-200 ${sel ? "opacity-75" : "opacity-35 group-hover:opacity-60"}`}>
                  ⌃{it.shortcut}
                </kbd>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer Status */}
      <div className={`py-3 border-t border-sidebar-border text-[10px] text-sidebar-text shrink-0 bg-sidebar-bg/50 ${isCollapsed ? "px-0 flex justify-center" : "px-4"}`}>
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2 shrink-0">
            {online && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full size-2 ${online ? "bg-success shadow-sm shadow-success/40" : "bg-ink-300"}`} />
          </span>
          {!isCollapsed && (
            <span className="font-mono tracking-wider text-[10px] truncate">
              {online ? "节点 NODE-01 // 已连接" : "节点 NODE-01 // 离线"}
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
