import type { Page } from "#/lib/types"
import { getPageImageUrl } from "#/lib/api"
import { MonitorDot } from "lucide-react"

interface Props {
  page: Page | null
}

export function EInkPreview({ page }: Props) {
  const imageUrl = page ? getPageImageUrl(page.id) : null

  return (
    <div className="relative inline-block">
      {/* 设备模拟外壳 */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "#1e293b",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* 顶部装饰条 */}
        <div className="flex items-center justify-center mb-3">
          <div className="w-10 h-1 rounded-full" style={{ background: "#334155" }} />
        </div>

        {/* 屏幕区域 */}
        <div
          className="overflow-hidden rounded-sm"
          style={{
            width: 400,
            height: 300,
            maxWidth: "100%",
            background: "#fafaf9",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={page?.templateId ?? "e-ink"}
              className="w-full h-full object-contain"
              style={{ imageRendering: "pixelated" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: "#d6d3d1" }}>
              <MonitorDot size={36} strokeWidth={1.5} />
              <span className="mt-3 text-[11px] tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>
                NO SIGNAL
              </span>
              <span className="text-[10px] mt-1">等待页面生成...</span>
            </div>
          )}
        </div>

        {/* 底部标签 */}
        <div className="flex items-center justify-between mt-3 px-1">
          <span
            className="text-[9px] tracking-widest opacity-30"
            style={{ fontFamily: "var(--font-mono)", color: "white" }}
          >
            4.2" E-PAPER · 400×300
          </span>
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: page ? "#4ade80" : "#475569" }}
          />
        </div>
      </div>
    </div>
  )
}
