import { useState } from "react"
import { usePageStore } from "#/stores/pageStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import { useAppStore } from "#/stores/appStore"
import * as api from "#/lib/api"
import type { Page, Recommendation } from "#/lib/types"

// ── Helpers ──────────────────────────────────────────────────────

function fmtTime(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const h = d.getHours().toString().padStart(2, "0")
  const m = d.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}

// ── Sub-components ────────────────────────────────────────────────

function AiBanner({ recommendation }: { recommendation: Recommendation | null }) {
  const device = useDeviceStore((s) => s.device)
  const showToast = useAppStore((s) => s.showToast)
  const addEvent = useEventStore((s) => s.addEvent)
  const [pushing, setPushing] = useState(false)

  if (!recommendation) return null

  const handleExecute = async () => {
    const page = recommendation.candidatePages?.[0]
    if (!page || !device) {
      showToast("无可推送页面或设备未连接", "error")
      return
    }
    setPushing(true)
    try {
      await api.pushPageToDevice(page.id, device.id)
      useDeviceStore.getState().setLastRefresh(new Date())
      showToast(`已执行 AI 推荐: ${page.templateId}`, "success")
      addEvent({ type: "quest", message: `执行 AI 推荐: ${page.templateId}` })
    } catch {
      showToast("推送失败，请检查设备连接", "error")
    } finally {
      setPushing(false)
    }
  }

  return (
    <div className="mb-6 bg-surface-container-highest border border-outline-variant rounded-lg p-4 flex items-start gap-4">
      <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
        auto_awesome
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="bento-label mb-1">AI 洞察</h3>
        <p className="text-[14px] text-primary leading-snug">
          {recommendation.reason ?? `建议推送模板 ${recommendation.templateId}，优先级 P${recommendation.priority}`}
        </p>
      </div>
      <button
        onClick={handleExecute}
        disabled={pushing || !device}
        className="shrink-0 bg-primary text-on-primary text-[11px] font-mono font-bold px-4 py-2 rounded uppercase tracking-wide hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {pushing ? "推送中..." : "执行"}
      </button>
    </div>
  )
}

function UniversalInputCard() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const showToast = useAppStore((s) => s.showToast)
  const setActiveChannel = useAppStore((s) => s.setActiveChannel)
  const addEvent = useEventStore((s) => s.addEvent)

  const handlePaste = async () => {
    try {
      const t = await navigator.clipboard.readText()
      if (!t.trim()) { showToast("剪贴板为空", "info"); return }
      setText(t)
      showToast("已粘贴剪贴板内容", "success")
    } catch {
      showToast("无法读取剪贴板，请检查浏览器权限", "error")
    }
  }

  const handlePush = async () => {
    if (!text.trim()) { showToast("请先输入内容", "info"); return }
    setLoading(true)
    try {
      await api.generateQuest({ text: text.trim() })
      showToast("内容生成中，已跳转到内容实验室", "success")
      addEvent({ type: "quest", message: `从输入生成任务: ${text.slice(0, 40)}` })
      setText("")
      setActiveChannel("quest")
    } catch {
      showToast("内容生成失败，请检查 AI 引擎状态", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bento-card">
      <div className="bento-header">
        <h2 className="bento-label">全局输入</h2>
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>edit_note</span>
      </div>
      <textarea
        className="input-minimal h-28 mb-4 placeholder:text-on-surface-variant text-on-surface"
        placeholder="输入文本、命令或粘贴内容..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={handlePaste}
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors"
            title="粘贴剪贴板"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_paste</span>
          </button>
          <button
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors opacity-40 cursor-not-allowed"
            title="上传截图 (暂不支持)"
            disabled
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>image</span>
          </button>
          <button
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors opacity-40 cursor-not-allowed"
            title="语音输入 (暂不支持)"
            disabled
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>mic</span>
          </button>
        </div>
        <button
          onClick={handlePush}
          disabled={loading}
          className="bg-primary text-on-primary text-[11px] font-mono font-bold px-4 py-2 rounded uppercase tracking-wide flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <span className={`material-symbols-outlined ${loading ? "animate-spin" : ""}`} style={{ fontSize: 14 }}>
            {loading ? "sync" : "psychology"}
          </span>
          {loading ? "生成中..." : "推送到屏幕"}
        </button>
      </div>
    </section>
  )
}

type HealthItem = {
  icon: string
  label: string
  value: string
  status: "ok" | "error" | "warn"
}

function HealthCard({ items }: { items: HealthItem[] }) {
  return (
    <section className="bento-card">
      <div className="bento-header">
        <h2 className="bento-label">系统健康</h2>
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>monitor_heart</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`border p-3 rounded-lg flex flex-col justify-between h-[88px] ${
              item.status === "error"
                ? "border-error bg-error-container"
                : "border-outline-variant bg-surface-container-low"
            }`}
          >
            <div className="flex justify-between items-start">
              <span
                className={`material-symbols-outlined ${
                  item.status === "error" ? "text-error" : "text-on-surface-variant"
                }`}
                style={{ fontSize: 20 }}
              >
                {item.icon}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  item.status === "ok"
                    ? "bg-secondary"
                    : item.status === "warn"
                    ? "bg-warning"
                    : "bg-error"
                }`}
              />
            </div>
            <div>
              <p
                className={`bento-label truncate ${
                  item.status === "error" ? "text-on-error-container" : "text-on-surface-variant"
                }`}
              >
                {item.label}
              </p>
              <p
                className={`font-mono text-[13px] font-medium mt-0.5 ${
                  item.status === "error" ? "text-on-error-container font-bold" : "text-primary"
                }`}
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function EInkPreviewCard({ currentPage }: { currentPage: Page | null }) {
  const candidatePages = usePageStore((s) => s.candidatePages)
  const setCurrentPage = usePageStore((s) => s.setCurrentPage)
  const showToast = useAppStore((s) => s.showToast)
  const [locked, setLocked] = useState(false)
  const [candidateIdx, setCandidateIdx] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const p = await api.getCurrentPage()
      if (p) {
        setCurrentPage(p)
        showToast("预览已刷新", "success")
      } else {
        showToast("当前无页面数据", "info")
      }
    } catch {
      showToast("刷新失败", "error")
    } finally {
      setRefreshing(false)
    }
  }

  const handleSwitch = () => {
    if (candidatePages.length === 0) { showToast("无候选页面可切换", "info"); return }
    if (locked) { showToast("已锁定，请先解锁", "info"); return }
    const next = (candidateIdx + 1) % candidatePages.length
    setCandidateIdx(next)
    setCurrentPage(candidatePages[next])
    showToast(`已切换至候选 ${next + 1}/${candidatePages.length}`, "info")
  }

  const handleLock = () => {
    const next = !locked
    setLocked(next)
    showToast(next ? "已锁定当前页面" : "已解锁页面切换", "info")
  }

  return (
    <section className="bento-card h-full flex flex-col">
      <div className="bento-header">
        <h2 className="bento-label">4.2″ 电子墨水屏实时预览</h2>
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>preview</span>
      </div>

      <div className="flex-1 flex items-center justify-center py-6">
        <div className="e-ink-screen w-[240px] aspect-[3/4] relative flex flex-col p-3">
          <div className="flex-1 border-2 border-primary bg-white p-3 flex flex-col relative overflow-hidden">
            {/* Glare */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />

            {currentPage ? (
              <>
                <div className="border-b-2 border-primary pb-2 mb-3 flex justify-between items-end">
                  <h3 className="font-display font-bold text-primary text-base leading-none uppercase tracking-tight">
                    {currentPage.templateId ?? "今日重点"}
                  </h3>
                  <span className="font-mono text-[11px] text-primary font-bold">
                    {new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }).replace("/", "/")}
                  </span>
                </div>
                <div className="flex-1 text-primary text-[13px] font-display leading-snug whitespace-pre-wrap break-words overflow-hidden">
                  {currentPage.reason ?? "当前显示内容"}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 32 }}>
                  tv_off
                </span>
                <p className="font-mono text-[11px] text-outline uppercase tracking-wider">暂无页面</p>
              </div>
            )}

            <div className="mt-auto border-t-2 border-primary pt-2 flex justify-between items-center">
              <span className="font-mono text-[11px] font-bold">INKOPS OS V2</span>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 14 }}>battery_5_bar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Controls */}
      <div className="pt-4 border-t border-surface-container-highest flex justify-center gap-3">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 border border-outline-variant text-on-surface-variant bento-label hover:bg-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <span className={`material-symbols-outlined ${refreshing ? "animate-spin" : ""}`} style={{ fontSize: 14 }}>sync</span>
          刷新
        </button>
        <button
          onClick={handleSwitch}
          className="px-3 py-1.5 border border-outline-variant text-on-surface-variant bento-label hover:bg-surface-variant hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>swap_horiz</span>
          切换
          {candidatePages.length > 0 && (
            <span className="font-mono text-[10px] text-outline">({candidatePages.length})</span>
          )}
        </button>
        <button
          onClick={handleLock}
          className={`px-3 py-1.5 border bento-label transition-colors flex items-center gap-1.5 ${
            locked
              ? "border-secondary bg-secondary-container text-on-secondary-container"
              : "border-outline-variant text-on-surface-variant hover:bg-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{locked ? "lock" : "lock_open"}</span>
          {locked ? "已锁定" : "锁定"}
        </button>
      </div>
    </section>
  )
}

function DailyTimelineCard() {
  const events = useEventStore((s) => s.events)

  return (
    <section className="bento-card h-full flex flex-col">
      <div className="bento-header">
        <h2 className="bento-label">每日时间线</h2>
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>history</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 space-y-0 relative min-h-0">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-surface-container-highest z-0" />

        {events.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-mono text-[11px] text-outline uppercase tracking-wider">暂无事件记录</p>
          </div>
        ) : (
          events.slice(0, 20).map((e, i) => {
            const isLatest = i === 0
            return (
              <div key={e.id} className={`relative z-10 flex gap-3 pb-5 ${i > 2 ? "opacity-60" : ""}`}>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 bg-surface ${
                    isLatest ? "border-primary" : "border-outline-variant"
                  }`}
                >
                  {isLatest && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-on-surface-variant mb-0.5">{fmtTime(e.timestamp)}</p>
                  <p className="text-[13px] text-primary font-medium leading-snug">
                    {e.type === "alert" && <span className="text-error mr-1">▲</span>}
                    {e.type === "quest" && <span className="text-secondary mr-1">◆</span>}
                    {e.message}
                  </p>
                  {e.type === "commit" && (
                    <span className="font-mono text-[11px] text-on-surface-variant mt-1 bg-surface-container-low inline-block px-2 py-0.5 rounded">
                      commit
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export function BridgePage() {
  const currentPage = usePageStore((s) => s.currentPage)
  const candidates = usePageStore((s) => s.candidatePages)
  const recommendation = usePageStore((s) => s.aiRecommendation)
  const isOnline = useDeviceStore((s) => s.isOnline)
  const backendOnline = useAppStore((s) => s.backendOnline)

  const healthItems: HealthItem[] = [
    {
      icon: "desktop_windows",
      label: "主显示器",
      value: isOnline ? "在线" : "离线",
      status: isOnline ? "ok" : "error",
    },
    {
      icon: "cloud",
      label: "AI 引擎",
      value: backendOnline ? "运行中" : "离线",
      status: backendOnline ? "ok" : "error",
    },
    {
      icon: "account_tree",
      label: "候选队列",
      value: `${candidates.length} 帧`,
      status: candidates.length > 0 ? "ok" : "warn",
    },
    {
      icon: "memory",
      label: "当前页面",
      value: currentPage ? currentPage.templateId ?? "活跃" : "无",
      status: currentPage ? "ok" : "warn",
    },
  ]

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-8">
        {/* AI Banner */}
        <AiBanner recommendation={recommendation} />

        {/* 3-Column Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input + Health (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            <UniversalInputCard />
            <HealthCard items={healthItems} />
          </div>

          {/* Center Column: E-Ink Preview (5/12) */}
          <div className="lg:col-span-5 h-full">
            <EInkPreviewCard currentPage={currentPage} />
          </div>

          {/* Right Column: Daily Timeline (3/12) */}
          <div className="lg:col-span-3" style={{ maxHeight: 600 }}>
            <DailyTimelineCard />
          </div>
        </div>
      </div>
    </div>
  )
}
