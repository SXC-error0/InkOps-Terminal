import { useState, useRef, useEffect } from "react"
import { useAppStore } from "#/stores/appStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { usePageStore } from "#/stores/pageStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"
import type { Channel } from "#/lib/types"

const CHANNELS: Array<{ id: Channel; label: string; keys: string[] }> = [
  { id: "bridge",   label: "仪表盘",    keys: ["仪表盘", "bridge", "dashboard"] },
  { id: "quest",    label: "内容实验室", keys: ["内容", "实验室", "quest", "ai", "content"] },
  { id: "launch",   label: "项目执行",  keys: ["项目", "执行", "launch", "project"] },
  { id: "terminal", label: "系统状态",  keys: ["系统", "状态", "terminal", "system"] },
  { id: "watcher",  label: "归档",      keys: ["归档", "watcher", "archive"] },
  { id: "signals",  label: "生活中心",  keys: ["生活", "中心", "signals", "life"] },
  { id: "studio",   label: "时间线",    keys: ["时间线", "studio", "timeline"] },
  { id: "device",   label: "设备管理",  keys: ["设备", "管理", "device"] },
]

export function TopBar() {
  const backendOnline = useAppStore((s) => s.backendOnline)
  const setBackendOnline = useAppStore((s) => s.setBackendOnline)
  const setActiveChannel = useAppStore((s) => s.setActiveChannel)
  const showToast = useAppStore((s) => s.showToast)

  const isOnline = useDeviceStore((s) => s.isOnline)
  const device = useDeviceStore((s) => s.device)

  const currentPage = usePageStore((s) => s.currentPage)

  const addEvent = useEventStore((s) => s.addEvent)

  const [search, setSearch] = useState("")
  const [focused, setFocused] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pushing, setPushing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ctrl+K focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const suggestions = search.trim()
    ? CHANNELS.filter((c) =>
        c.keys.some((k) => k.includes(search.toLowerCase())) ||
        c.label.includes(search)
      )
    : []

  const jumpTo = (ch: Channel) => {
    setActiveChannel(ch)
    setSearch("")
    inputRef.current?.blur()
  }

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const res = await fetch("http://127.0.0.1:8700/api/health")
      if (res.ok) {
        setBackendOnline(true)
        const devs = await api.discoverDevices()
        if (devs.length > 0) {
          useDeviceStore.getState().setDevice(devs[0])
          useDeviceStore.getState().setOnline(devs[0].status === "online")
        } else {
          useDeviceStore.getState().setOnline(false)
        }
        showToast("系统状态已刷新", "success")
        addEvent({ type: "system", message: "手动刷新完成" })
      } else {
        setBackendOnline(false)
        showToast("后端无响应", "error")
      }
    } catch {
      setBackendOnline(false)
      showToast("刷新失败：无法连接后端", "error")
    } finally {
      setRefreshing(false)
    }
  }

  const handlePush = async () => {
    if (!currentPage || !device || pushing) return
    setPushing(true)
    try {
      await api.pushPageToDevice(currentPage.id, device.id)
      useDeviceStore.getState().setLastRefresh(new Date())
      showToast(`已推送 ${currentPage.templateId} 到设备`, "success")
      addEvent({ type: "system", message: `快捷推送: ${currentPage.templateId}` })
    } catch {
      showToast("推送失败，请检查设备连接", "error")
    } finally {
      setPushing(false)
    }
  }

  const handleAiInsight = () => {
    setActiveChannel("quest")
  }

  return (
    <header className="flex justify-between items-center w-full px-8 h-14 shrink-0 bg-surface border-b border-outline-variant sticky top-0 z-50 relative">
      {/* Left: Quick-jump search */}
      <div className="relative flex items-center">
        <div
          className={`flex items-center bg-surface-container-low px-3 py-1.5 border gap-2 transition-colors ${
            focused ? "border-secondary" : "border-outline-variant"
          }`}
        >
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 16 }}>search</span>
          <input
            ref={inputRef}
            className="bg-transparent border-none outline-none text-[13px] text-on-surface placeholder:text-on-surface-variant w-52"
            placeholder="跳转频道...  Ctrl+K"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => { setFocused(false); setSearch("") }, 160)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setSearch(""); inputRef.current?.blur() }
              if (e.key === "Enter" && suggestions.length > 0) jumpTo(suggestions[0].id)
            }}
          />
          {search && (
            <span className="font-mono text-[10px] text-on-surface-variant whitespace-nowrap">↵ 跳转</span>
          )}
        </div>

        {/* Dropdown suggestions */}
        {focused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-outline-variant shadow-lg z-50 overflow-hidden">
            {suggestions.map((ch) => (
              <button
                key={ch.id}
                onMouseDown={() => jumpTo(ch.id)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-variant transition-colors text-left"
              >
                <span className="text-[13px] text-primary font-medium">{ch.label}</span>
                <span className="font-mono text-[11px] text-outline">{ch.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: actions + status */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="刷新系统状态"
          className="text-on-surface-variant hover:text-primary transition-colors p-2 hover:bg-surface-variant flex items-center justify-center disabled:opacity-40"
        >
          <span className={`material-symbols-outlined text-[20px] ${refreshing ? "animate-spin" : ""}`}>refresh</span>
        </button>

        <button
          onClick={handlePush}
          disabled={!backendOnline || !isOnline || !currentPage || pushing}
          title={backendOnline && isOnline ? "推送当前页面到设备" : "设备离线"}
          className={`transition-colors p-2 flex items-center justify-center ${
            backendOnline && isOnline && currentPage
              ? "text-on-surface-variant hover:text-primary hover:bg-surface-variant"
              : "text-outline-variant cursor-not-allowed opacity-40"
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${pushing ? "animate-pulse" : ""}`}>cloud_upload</span>
        </button>

        <button
          onClick={handleAiInsight}
          title="内容实验室 (AI)"
          className="text-on-surface-variant hover:text-primary transition-colors p-2 hover:bg-surface-variant flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
        </button>

        {/* Backend status badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono ml-1 ${
            backendOnline ? "text-secondary" : "bg-error-container text-on-error-container px-2"
          }`}
          title={backendOnline ? "后端在线" : "后端离线"}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? "bg-secondary animate-pulse" : "bg-error"}`} />
          {backendOnline ? "API" : "离线"}
        </div>

        {/* Avatar */}
        <div
          className="w-7 h-7 overflow-hidden border border-outline-variant ml-1 bg-surface-container-high flex items-center justify-center cursor-pointer hover:border-outline transition-colors"
          title="个人资料"
        >
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 16 }}>person</span>
        </div>
      </div>
    </header>
  )
}
