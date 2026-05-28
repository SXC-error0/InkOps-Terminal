import { useState } from "react"
import { Sparkles, Send } from "lucide-react"
import { usePageStore } from "#/stores/pageStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"
import type { QuestPayload, Page } from "#/lib/types"

const PERSONAS = [
  { key: "guild", label: "公会任务官", desc: "沉稳可靠的 RPG 风格" },
  { key: "commander", label: "舰桥副官", desc: "冷静干练的军事风格" },
  { key: "instructor", label: "黑客教官", desc: "犀利直接的极客风格" },
  { key: "pet", label: "毒舌监督者", desc: "吐槽但关心的伙伴" },
]

export function QuestPage() {
  const [text, setText] = useState("")
  const [persona, setPersona] = useState("guild")
  const [quest, setQuest] = useState<QuestPayload | null>(null)
  const [page, setPage] = useState<Page | null>(null)
  const [generating, setGenerating] = useState(false)
  const [pushing, setPushing] = useState(false)

  const setCurrentPage = usePageStore((s) => s.setCurrentPage)
  const setCandidates = usePageStore((s) => s.setCandidates)
  const isOnline = useDeviceStore((s) => s.isOnline)
  const device = useDeviceStore((s) => s.device)
  const addEvent = useEventStore((s) => s.addEvent)

  const handleGenerate = async () => {
    if (!text.trim()) return
    setGenerating(true)
    try {
      const result = await api.generateQuest({ text, persona })
      setQuest(result)
      addEvent({ type: "quest", message: `任务生成: ${result.mainQuest}` })
      const history = await api.getPageHistory(1)
      const p = history[0]
      if (p) { setPage(p); setCurrentPage(p); setCandidates([p]) }
    } catch (e) {
      addEvent({ type: "system", message: `生成失败: ${e}` })
    } finally {
      setGenerating(false)
    }
  }

  const handlePush = async () => {
    if (!page || !device) return
    setPushing(true)
    try {
      await api.pushPageToDevice(page.id, device.id)
      addEvent({ type: "system", message: "已推送" })
    } catch {
      addEvent({ type: "alert", message: "推送失败" })
    } finally { setPushing(false) }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-5 gap-5" style={{ minHeight: "calc(100vh - 140px)" }}>
          {/* 左: 输入 */}
          <div className="col-span-3 card flex flex-col">
            <div className="card-header">
              <Sparkles size={15} style={{ color: "var(--color-purple)" }} />
              <span>输入今日待办</span>
            </div>
            <div className="flex-1 flex flex-col p-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 w-full resize-none rounded-lg p-4 text-[14px] leading-relaxed outline-none"
                style={{
                  background: "var(--color-bg)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                }}
                placeholder="写下今天要做的事...&#10;&#10;例如:&#10;1. 完成墨水屏自动刷新接口&#10;2. 修复二维码留言页面&#10;3. 晚上去健身"
              />
              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border-light)" }}>
                <div className="flex gap-1.5">
                  {PERSONAS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPersona(p.key)}
                      title={p.desc}
                      className="px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                      style={{
                        background: persona === p.key ? "#f5f3ff" : "transparent",
                        color: persona === p.key ? "var(--color-purple)" : "var(--color-text-muted)",
                        border: `1px solid ${persona === p.key ? "#ddd6fe" : "transparent"}`,
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerate} disabled={!text.trim() || generating} className="btn btn-primary">
                  <Sparkles size={14} className={generating ? "animate-spin" : ""} />
                  {generating ? "生成中..." : "生成任务卷轴"}
                </button>
              </div>
            </div>
          </div>

          {/* 右: 预览 */}
          <div className="col-span-2 card flex flex-col">
            <div className="card-header">卷轴预览</div>
            <div className="flex-1 flex flex-col p-4 overflow-auto">
              {quest ? (
                <>
                  <div className="flex-1 rounded-lg p-5 space-y-3 text-[13px] leading-relaxed" style={{
                    background: "var(--color-bg)", border: "1px solid var(--color-border-light)", fontFamily: "var(--font-mono)",
                  }}>
                    <div className="text-center" style={{ color: "var(--color-purple)" }}>
                      <div className="tracking-widest text-[12px]">DAILY QUEST / LV.01</div>
                    </div>
                    <div>
                      <div className="text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>★ 主线</div>
                      <div style={{ color: "var(--color-text)" }}>{quest.mainQuest}</div>
                    </div>
                    {quest.sideQuests.length > 0 && (
                      <div>
                        <div className="text-[11px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>◆ 支线</div>
                        {quest.sideQuests.map((sq, i) => (
                          <div key={i} style={{ color: "var(--color-text-secondary)" }}>□ {sq}</div>
                        ))}
                      </div>
                    )}
                    <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: 10 }}>
                      <div className="flex justify-between text-[12px]">
                        <span style={{ color: "var(--color-text-muted)" }}>☠ BOSS</span>
                        <span style={{ color: "var(--color-warning)" }}>{quest.bossName}</span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span style={{ color: "var(--color-text-muted)" }}>弱点</span>
                        <span style={{ color: "var(--color-text-secondary)" }}>{quest.bossWeakness}</span>
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: 10 }}>
                      <div style={{ color: "var(--color-danger)" }}>🚫 {quest.ban}</div>
                      <div className="mt-1" style={{ color: "var(--color-success)" }}>🏆 {quest.reward}</div>
                    </div>
                    <div className="text-center pt-2" style={{ borderTop: "1px solid var(--color-border-light)", color: "var(--color-purple)" }}>
                      「{quest.declaration}」
                    </div>
                  </div>
                  <button onClick={handlePush} disabled={!isOnline || pushing} className="btn btn-primary w-full mt-4">
                    <Send size={14} />
                    {pushing ? "推送中..." : isOnline ? "推送到墨水屏" : "设备离线"}
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
                  <Sparkles size={36} className="mb-3 opacity-20" />
                  <span className="text-[13px]">输入待办, AI 生成任务卷轴</span>
                  <span className="text-[11px] mt-1">支持 4 种 AI 人格风格</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
