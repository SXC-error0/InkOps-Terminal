import type { Page } from "#/lib/types"
import { getPageImageUrl } from "#/lib/api"
import { Monitor } from "lucide-react"

interface Props { page: Page | null }

export function EInkPreview({ page }: Props) {
  const imageUrl = page ? getPageImageUrl(page.id) : null

  return (
    <div className="relative inline-block group">
      <div className="rounded-2xl p-5 bg-eink-case
        shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_20px_50px_-12px_rgba(0,0,0,0.25),0_4px_12px_-4px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-1 rounded-full bg-white/[0.08]" />
        </div>
        <div className={`overflow-hidden w-[400px] h-[300px] max-w-full bg-eink-screen
          shadow-[0_0_0_4px_#0f172a,0_0_0_5px_#334155,inset_0_1px_4px_rgba(0,0,0,0.06)]
          transition-shadow duration-300
          ${imageUrl ? "group-hover:shadow-[0_0_0_4px_#0f172a,0_0_0_5px_#334155,inset_0_1px_4px_rgba(0,0,0,0.06),0_0_30px_-10px_rgba(14,165,233,0.15)]" : ""}`}>
          {imageUrl ? (
            <img src={imageUrl} alt={page?.templateId ?? "e-ink"} className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Monitor size={36} strokeWidth={1} className="text-ink-200/50" />
              <div className="mt-4 text-[11px] font-mono tracking-[0.2em] text-ink-300">NO SIGNAL</div>
              <div className="mt-1.5 text-[10px] text-ink-300/60">等待页面生成...</div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-[9px] font-mono tracking-[0.15em] text-white/25">4.2" E-PAPER · 400×300</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-white/25">{page ? "READY" : "IDLE"}</span>
            <span className={`size-2 rounded-full ${page ? "bg-success" : "bg-white/[0.15]"}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
