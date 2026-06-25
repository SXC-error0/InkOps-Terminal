import { useState } from "react"
import { usePageStore } from "#/stores/pageStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"
import type { QuestPayload } from "#/lib/types"

// ── Types ─────────────────────────────────────────────────────────

type SourceTab = "text" | "url" | "file" | "screenshot"
type OutputFormat = "bento" | "list" | "mindmap"

const SOURCE_TABS: { id: SourceTab; label: string; icon: string }[] = [
  { id: "text",       label: "文本",   icon: "subject" },
  { id: "url",        label: "网址",   icon: "link" },
  { id: "file",       label: "文件",   icon: "upload_file" },
  { id: "screenshot", label: "截图",   icon: "screenshot_region" },
]

const PRESETS = [
  { label: "学习卡片", icon: "school" },
  { label: "面试准备", icon: "work" },
  { label: "会议摘要", icon: "groups" },
  { label: "任务熔炉", icon: "psychology" },
]

// ── Toggle Switch ─────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${on ? "bg-secondary" : "bg-surface-variant"}`}
    >
      <div
        className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${on ? "right-0.5" : "left-0.5"}`}
      />
    </button>
  )
}

// ── E-Ink Preview Panel ───────────────────────────────────────────

function EInkPreviewPanel({ quest }: { quest: QuestPayload | null }) {
  if (!quest) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-8">
        <span className="material-symbols-outlined text-outline" style={{ fontSize: 40 }}>preview</span>
        <div>
          <p className="bento-label text-outline mb-1">预览模式已激活</p>
          <p className="text-[13px] text-on-surface-variant">执行处理管线后，E-Ink 预览将在此出现</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-4">
      <div className="e-ink-screen w-[220px] aspect-[3/4] relative flex flex-col p-3">
        <div className="flex-1 border-2 border-primary bg-white p-3 flex flex-col gap-2 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
          <div className="border-b-2 border-primary pb-1.5">
            <p className="font-mono font-bold text-[11px] text-primary uppercase tracking-widest">今日任务卷轴</p>
          </div>
          <p className="text-[12px] font-bold text-primary leading-snug">⚔ {quest.mainQuest}</p>
          {quest.sideQuests.slice(0, 2).map((s, i) => (
            <p key={i} className="text-[10px] text-primary/80 leading-snug">□ {s}</p>
          ))}
          <div className="mt-auto border-t border-primary pt-1 flex justify-between items-center">
            <span className="font-mono text-[9px]">INKOPS OS</span>
            <span className="font-mono text-[9px] text-error">☠ {quest.bossName}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export function QuestPage() {
  const [sourceTab, setSourceTab] = useState<SourceTab>("text")
  const [text, setText] = useState("")
  const [extract, setExtract] = useState(true)
  const [translate, setTranslate] = useState(false)
  const [format, setFormat] = useState(true)
  const [outputFmt, setOutputFmt] = useState<OutputFormat>("bento")
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [quest, setQuest] = useState<QuestPayload | null>(null)
  const [loading, setLoading] = useState(false)

  const setCurrentPage = usePageStore((s) => s.setCurrentPage)
  const setCandidates = usePageStore((s) => s.setCandidates)
  const addEvent = useEventStore((s) => s.addEvent)

  const execute = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const r = await api.generateQuest({ text, persona: "guild" })
      setQuest(r)
      addEvent({ type: "quest", message: `AI 处理完成: ${r.mainQuest}` })
      const h = await api.getPageHistory(1)
      const p = h[0]
      if (p) { setCurrentPage(p); setCandidates([p]) }
    } catch (e) {
      addEvent({ type: "system", message: `处理失败: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-hidden bg-background flex flex-col">
      {/* Page Header */}
      <div className="h-14 shrink-0 bg-surface border-b border-outline-variant flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-bold text-primary text-base">内容实验室</h1>
          <span className="px-2 py-0.5 border border-secondary text-secondary text-[10px] font-mono rounded-sm bg-secondary/10">
            AI 中心
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select className="appearance-none bg-surface-container-lowest border border-outline-variant rounded text-[13px] text-on-surface pl-3 pr-8 py-1.5 cursor-pointer outline-none">
              <option>加载预设...</option>
              {PRESETS.map((p) => <option key={p.label}>{p.label}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: 16 }}>arrow_drop_down</span>
          </div>
          <button className="p-1.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          </button>
          <button className="p-1.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cloud_upload</span>
          </button>
        </div>
      </div>

      {/* 3-Column Workspace */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="grid grid-cols-12 gap-6 h-full">

          {/* Col 1: Input Source (3/12) */}
          <div className="col-span-3 flex flex-col gap-4 h-full overflow-y-auto pb-2">
            <section className="bento-card flex-1 flex flex-col min-h-0" style={{ gap: 0 }}>
              <div className="bento-header mb-4">
                <span className="bento-label">01. 输入源</span>
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>input</span>
              </div>

              {/* Source Type Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SOURCE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSourceTab(tab.id)}
                    className={`px-3 py-2 rounded-sm text-[13px] font-mono flex items-center justify-center gap-1.5 transition-colors border ${
                      sourceTab === tab.id
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Input */}
              <div className="flex-1 flex flex-col relative min-h-0">
                <label className="font-mono text-[11px] text-on-surface-variant mb-2">原始内容缓冲</label>
                <textarea
                  className="flex-1 w-full bg-surface resize-none border-b-2 border-outline-variant focus:border-secondary text-on-surface text-[14px] p-3 rounded-t-sm outline-none min-h-[200px]"
                  placeholder="粘贴原始文本、代码或文章内容以进行 AI 处理..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="absolute bottom-3 right-3 text-outline text-[11px] font-mono">
                  {text.length} / 4096
                </div>
              </div>
            </section>
          </div>

          {/* Col 2: Processing Pipeline (4/12) */}
          <div className="col-span-4 flex flex-col gap-4 h-full overflow-y-auto pb-2">
            <section className="bento-card flex-1 flex flex-col" style={{ gap: 0 }}>
              <div className="bento-header mb-4">
                <span className="bento-label">02. 处理管线</span>
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>memory</span>
              </div>

              {/* Preset Quick Select */}
              <div className="bg-surface-container-low border border-outline-variant p-4 rounded-sm mb-4">
                <p className="bento-label mb-3">管线预设</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setActivePreset(activePreset === p.label ? null : p.label)}
                      className={`px-3 py-1 rounded-full text-[12px] font-mono flex items-center gap-1 transition-colors border ${
                        activePreset === p.label
                          ? "border-secondary text-secondary bg-secondary/10"
                          : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Processing Modules */}
              <div className="flex flex-col gap-3 flex-1">
                {/* Module 01: Extraction */}
                <div className="border border-outline-variant p-3 hover:border-outline transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-mono text-[13px] text-primary font-bold">
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>compress</span>
                      [01] 提取
                    </div>
                    <Toggle on={extract} onChange={setExtract} />
                  </div>
                  <p className="text-[12px] text-on-surface-variant mb-3">提取核心实体、关键论点和操作项。去除冗余。</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-outline">密度</span>
                    <div className="flex-1 h-1 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-primary" />
                    </div>
                    <span className="text-[10px] font-mono text-primary">高</span>
                  </div>
                </div>

                {/* Module 02: Translation */}
                <div className="border border-outline-variant p-3 hover:border-outline transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-mono text-[13px] text-primary font-bold">
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>translate</span>
                      [02] 翻译
                    </div>
                    <Toggle on={translate} onChange={setTranslate} />
                  </div>
                  <div className={`transition-opacity ${translate ? "" : "opacity-40 pointer-events-none"}`}>
                    <select className="w-full bg-surface border-b-2 border-outline-variant text-[13px] py-1 font-mono outline-none">
                      <option>英文 → 中文</option>
                      <option>中文 → 英文</option>
                      <option>自动检测</option>
                    </select>
                  </div>
                </div>

                {/* Module 03: Formatting */}
                <div className="border border-outline-variant p-3 hover:border-outline transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-mono text-[13px] text-primary font-bold">
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>grid_view</span>
                      [03] 格式化
                    </div>
                    <Toggle on={format} onChange={setFormat} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(["bento", "list", "mindmap"] as OutputFormat[]).map((f, i) => (
                      <button
                        key={f}
                        onClick={() => setOutputFmt(f)}
                        className={`py-1 text-[10px] font-mono border transition-colors ${
                          outputFmt === f
                            ? "border-secondary bg-secondary/5 text-secondary"
                            : "border-outline-variant text-outline hover:bg-surface"
                        }`}
                      >
                        {["便当盒", "列表", "思维导图"][i]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Execute Button */}
              <div className="mt-4 pt-4 border-t border-outline-variant">
                <button
                  onClick={execute}
                  disabled={!text.trim() || loading}
                  className="w-full bg-primary text-on-primary py-3 px-4 flex items-center justify-center gap-2 text-[14px] font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span>
                  {loading ? "处理中..." : "执行并推送"}
                </button>
              </div>
            </section>
          </div>

          {/* Col 3: E-Ink Preview (5/12) */}
          <div className="col-span-5 h-full">
            <section className="bento-card h-full flex flex-col" style={{ backgroundColor: "#f2f4f6", border: "none" }}>
              <div className="flex items-center gap-2 pb-3 mb-1">
                <span className={`w-2 h-2 rounded-full ${loading ? "bg-error animate-pulse" : "bg-success"}`} />
                <span className="bento-label">{loading ? "处理中..." : "预览模式已激活"}</span>
              </div>
              <EInkPreviewPanel quest={quest} />
              {quest && (
                <div className="mt-4 space-y-2 border-t border-outline-variant pt-4">
                  <div className="bg-surface-container-lowest border border-outline-variant p-3 rounded">
                    <p className="bento-label mb-1.5">处理结果</p>
                    <p className="text-[13px] text-primary font-medium">⚔ {quest.mainQuest}</p>
                    {quest.sideQuests.map((s, i) => (
                      <p key={i} className="text-[12px] text-on-surface-variant mt-1">□ {s}</p>
                    ))}
                    {quest.ban && <p className="text-[12px] text-error mt-1">🚫 禁忌: {quest.ban}</p>}
                    {quest.reward && <p className="text-[12px] text-success mt-1">🏆 奖励: {quest.reward}</p>}
                  </div>
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  )
}
