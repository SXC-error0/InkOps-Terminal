import { useState, useEffect } from "react"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"
import type { Page } from "#/lib/types"

// ── Helpers ───────────────────────────────────────────────────────

const templateLabel: Record<string, string> = {
  QUEST_SCROLL: "任务卷轴",
  TERMINAL_STATUS: "数据看板",
  LAUNCH_PANEL: "发射台",
  SYSTEM_ALERT: "系统告警",
  POSTCARD: "明信片",
  RELEASE_NEWS: "战报",
}

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  pushed:   { bg: "bg-success/10",  text: "text-success",  label: "已推送" },
  ready:    { bg: "bg-secondary/10", text: "text-secondary", label: "就绪" },
  draft:    { bg: "bg-surface-variant", text: "text-on-surface-variant", label: "草稿" },
  failed:   { bg: "bg-error-container", text: "text-error",  label: "失败" },
  archived: { bg: "bg-surface-variant", text: "text-outline", label: "归档" },
}

// ── Archive Card ──────────────────────────────────────────────────

function ArchiveCard({
  page,
  onPush,
  onRerender,
  loading,
}: {
  page: Page
  onPush: (id: string) => void
  onRerender: (id: string) => void
  loading: boolean
}) {
  const [hover, setHover] = useState(false)
  const s = statusBadge[page.status] ?? statusBadge.draft

  return (
    <div
      className="bento-card flex flex-col gap-3 cursor-pointer group hover:border-outline transition-all"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* E-Ink Thumbnail */}
      <div className="relative aspect-[3/4] bg-surface-container-low border border-outline-variant overflow-hidden rounded-sm">
        <div className="absolute inset-0 flex flex-col p-3">
          <div className="border-b-2 border-primary pb-1.5 mb-2">
            <p className="font-mono font-bold text-[10px] text-primary uppercase">
              {templateLabel[page.templateId] ?? page.templateId}
            </p>
          </div>
          <p className="text-[11px] text-primary/70 leading-snug line-clamp-4">
            {page.reason || "系统自动生成"}
          </p>
          <div className="mt-auto border-t border-primary/30 pt-1 flex justify-between">
            <span className="font-mono text-[9px] text-primary/60">INKOPS</span>
            <span className="font-mono text-[9px] text-primary/60">
              {page.createdAt?.slice(5, 10)}
            </span>
          </div>
        </div>

        {/* Hover Overlay */}
        {hover && (
          <div className="absolute inset-0 bg-primary/60 flex flex-col items-center justify-center gap-2 transition-all">
            <button
              onClick={(e) => { e.stopPropagation(); onPush(page.id) }}
              disabled={loading}
              className="px-3 py-1.5 bg-on-primary text-primary text-[11px] font-mono flex items-center gap-1 hover:opacity-90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>send_to_mobile</span>
              推送到屏幕
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRerender(page.id) }}
              disabled={loading}
              className="px-3 py-1.5 bg-surface text-on-surface text-[11px] font-mono flex items-center gap-1 hover:opacity-90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>refresh</span>
              克隆到实验室
            </button>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="bento-label text-primary truncate">{templateLabel[page.templateId] ?? page.templateId}</p>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${s.bg} ${s.text}`}>{s.label}</span>
        </div>
        <p className="text-[11px] text-on-surface-variant truncate">{page.reason || "系统触发"}</p>
        <p className="font-mono text-[10px] text-outline">{page.createdAt?.slice(0, 16).replace("T", " ")}</p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

const PAGE_SIZE = 8

export function WatcherPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("全部")
  const [statusFilter, setStatusFilter] = useState("全部")

  const device = useDeviceStore((s) => s.device)
  const isOnline = useDeviceStore((s) => s.isOnline)
  const addEvent = useEventStore((s) => s.addEvent)

  useEffect(() => {
    setLoading(true)
    api.getPageHistory(100).then(setPages).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = pages.filter((p) => {
    if (typeFilter !== "全部" && templateLabel[p.templateId] !== typeFilter) return false
    if (statusFilter !== "全部" && p.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handlePush = async (pageId: string) => {
    if (!device) return
    setActionLoading(true)
    try {
      await api.pushPageToDevice(pageId, device.id)
      useDeviceStore.getState().setLastRefresh(new Date())
      addEvent({ type: "system", message: "已推送历史页面至屏幕" })
    } catch {
      addEvent({ type: "alert", message: "推送失败" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRerender = async (pageId: string) => {
    setActionLoading(true)
    try {
      await api.reRenderPage(pageId)
      addEvent({ type: "system", message: "重新渲染命令已发送" })
    } catch {
      addEvent({ type: "alert", message: "重新渲染失败" })
    } finally {
      setActionLoading(false)
    }
  }

  const pageTypes = ["全部", ...Array.from(new Set(pages.map((p) => templateLabel[p.templateId] ?? p.templateId)))]
  const statusTypes = ["全部", "pushed", "ready", "draft", "failed"]

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-8 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-primary text-xl">归档</h1>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              {pages.length} 条长期数据资产
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); api.getPageHistory(100).then(setPages).catch(() => {}).finally(() => setLoading(false)) }}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors text-[13px] font-mono"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            刷新归档
          </button>
        </div>

        {/* Filter Bar */}
        <section className="bento-card">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="bento-label">页面类型</label>
              <select
                className="bg-surface-container-lowest border border-outline-variant text-[13px] text-on-surface px-3 py-2 outline-none"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }}
              >
                {pageTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="bento-label">状态</label>
              <select
                className="bg-surface-container-lowest border border-outline-variant text-[13px] text-on-surface px-3 py-2 outline-none"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
              >
                {statusTypes.map((t) => <option key={t}>{t === "全部" ? "全部" : (statusBadge[t]?.label ?? t)}</option>)}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2 text-[13px] text-on-surface-variant font-mono">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>inventory</span>
              共 {filtered.length} 条记录
            </div>
          </div>
        </section>

        {/* Gallery Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-outline animate-spin" style={{ fontSize: 32 }}>refresh</span>
          </div>
        ) : paginated.length === 0 ? (
          <section className="bento-card py-24 flex flex-col items-center text-center gap-4">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: 40 }}>archive</span>
            <p className="bento-label text-outline">归档库为空</p>
            <p className="text-[13px] text-on-surface-variant">生成的 E-Ink 页面快照将自动保存到归档。</p>
          </section>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginated.map((p) => (
              <ArchiveCard
                key={p.id}
                page={p}
                onPush={handlePush}
                onRerender={handleRerender}
                loading={actionLoading || !isOnline}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-outline-variant text-on-surface-variant hover:bg-surface-variant disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 font-mono text-[13px] border transition-colors ${
                    currentPage === page
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  {page}
                </button>
              )
            })}
            {totalPages > 7 && <span className="text-on-surface-variant font-mono">...{totalPages}</span>}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-outline-variant text-on-surface-variant hover:bg-surface-variant disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
