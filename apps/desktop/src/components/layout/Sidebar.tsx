import { useAppStore } from "#/stores/appStore"
import { useDeviceStore } from "#/stores/deviceStore"
import type { Channel } from "#/lib/types"
import { motion } from "framer-motion"

type NavItem = {
  id: Channel
  label: string
  icon: string
}

const mainItems: NavItem[] = [
  { id: "bridge",   label: "仪表盘",   icon: "dashboard" },
  { id: "studio",   label: "时间线",   icon: "timeline" },
  { id: "quest",    label: "内容实验室", icon: "psychology" },
  { id: "device",   label: "设备管理", icon: "settings_remote" },
  { id: "watcher",  label: "归档",     icon: "archive" },
]

const footerItems: NavItem[] = [
  { id: "launch",   label: "项目执行", icon: "rocket_launch" },
  { id: "terminal", label: "系统状态", icon: "monitor_heart" },
  { id: "signals",  label: "生活中心", icon: "self_improvement" },
]

export function Sidebar() {
  const active = useAppStore((s) => s.activeChannel)
  const setActive = useAppStore((s) => s.setActiveChannel)
  const online = useDeviceStore((s) => s.isOnline)

  return (
    <aside className="flex flex-col p-4 h-full w-64 shrink-0 bg-surface-container-low border-r border-outline-variant">
      {/* Brand / Device Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant overflow-hidden">
          <div className="w-full h-full bg-primary flex items-center justify-center rounded-full">
            <span className="text-on-primary text-xs font-bold font-mono tracking-widest">IO</span>
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="font-display font-bold text-primary text-base leading-tight truncate">终端_01</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5 flex items-center gap-1.5 leading-none">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${online ? "bg-success" : "bg-outline"}`}
            />
            ESP32-S3 • {online ? "在线" : "离线"}
          </p>
        </div>
      </div>

      {/* CTA: 新建条目 */}
      <button
        onClick={() => setActive("quest")}
        className="w-full bg-primary text-on-primary text-[14px] font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 mb-6 hover:opacity-90 active:scale-[0.99] transition-all duration-100"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 18 }}>add</span>
        新建条目
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {mainItems.map((item) => {
          const sel = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id as Channel)}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-100 outline-none ${
                sel
                  ? "text-on-secondary-container font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {sel && (
                <motion.span
                  layoutId="active-sidebar"
                  className="absolute inset-0 bg-secondary-container rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={`material-symbols-outlined relative z-10 ${sel ? "text-secondary" : ""}`}
                style={{ fontSize: 20 }}
              >
                {item.icon}
              </span>
              <span className="text-[14px] relative z-10">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="mt-4 border-t border-outline-variant pt-4 space-y-1">
        {footerItems.map((item) => {
          const sel = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id as Channel)}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-100 outline-none ${
                sel
                  ? "text-on-secondary-container font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {sel && (
                <motion.span
                  layoutId="active-sidebar-footer"
                  className="absolute inset-0 bg-secondary-container rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={`material-symbols-outlined relative z-10 ${sel ? "text-secondary" : ""}`}
                style={{ fontSize: 20 }}
              >
                {item.icon}
              </span>
              <span className="text-[14px] relative z-10">{item.label}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
