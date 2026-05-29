import type { Page } from "#/lib/types"
import { getPageImageUrl } from "#/lib/api"
import { Monitor } from "lucide-react"

interface Props { page: Page | null }

export function EInkPreview({ page }: Props) {
  const imageUrl = page ? getPageImageUrl(page.id) : null

  return (
    <div className="relative inline-block group">
      {/* Back ambient glowing halo (breathing style when page exists) */}
      {imageUrl && (
        <div className="absolute -inset-1.5 bg-gradient-to-r from-accent to-accent-light rounded-2xl opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-500" />
      )}
      
      {/* Physical Device Frame Case */}
      <div className="relative rounded-2xl p-6 bg-eink-case border border-white/[0.06]
        shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_25px_50px_-12px_rgba(0,0,0,0.7),0_8px_20px_-6px_rgba(0,0,0,0.5)]">
        
        {/* Hardware Status LED Light */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              {imageUrl && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full size-2 ${imageUrl ? "bg-success shadow-sm shadow-success/50" : "bg-white/10"}`} />
            </span>
            <span className="text-[9px] font-mono tracking-widest text-white/45">STATUS LED</span>
          </div>
          <div className="w-14 h-1 rounded-full bg-white/[0.06]" />
        </div>

        {/* E-Paper Screen Frame Bezel */}
        <div className={`overflow-hidden w-[400px] h-[300px] max-w-full bg-eink-screen relative rounded-xs
          shadow-[0_0_0_4px_#0b0c10,0_0_0_6px_#1e293b,inset_0_2px_6px_rgba(0,0,0,0.25)]
          transition-all duration-300
          ${imageUrl ? "group-hover:shadow-[0_0_0_4px_#0b0c10,0_0_0_6px_#0ea5e9,inset_0_2px_6px_rgba(0,0,0,0.25),0_0_30px_rgba(14,165,233,0.2)]" : ""}`}>
          
          {/* Subtle grid pattern overlay for paper texture */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none mix-blend-multiply" />
          
          {imageUrl ? (
            <img src={imageUrl} alt={page?.templateId ?? "e-ink"} className="w-full h-full object-contain mix-blend-multiply select-none" style={{ imageRendering: "pixelated" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-eink-screen text-[#1c1917]">
              <Monitor size={36} strokeWidth={1} className="opacity-30" />
              <div className="mt-4 text-[11px] font-mono tracking-[0.25em] opacity-40">SYSTEM STANDBY</div>
              <div className="mt-1.5 text-[9px] font-mono tracking-[0.1em] opacity-30">WAITING FOR RE-RENDER SIGNAL</div>
            </div>
          )}
        </div>

        {/* Hardware Footer branding & specs */}
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-[9px] font-mono tracking-[0.15em] text-white/30">INKOPS BRIDGE · V1.0</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono tracking-wider text-white/30">{imageUrl ? "4.2\" ACTIVE" : "4.2\" STANDBY"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
