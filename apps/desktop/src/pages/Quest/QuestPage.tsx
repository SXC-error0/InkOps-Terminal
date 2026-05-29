import { useState } from "react"
import { Sparkles, Send } from "lucide-react"
import { usePageStore } from "#/stores/pageStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"
import type { QuestPayload, Page } from "#/lib/types"

const personas = ["guild", "commander", "instructor", "pet"] as const
const pLabel: Record<string, string> = { guild: "公会", commander: "舰桥", instructor: "教官", pet: "毒舌" }

export function QuestPage() {
  const [text, setText] = useState("")
  const [persona, setPersona] = useState<string>("guild")
  const [quest, setQuest] = useState<QuestPayload | null>(null)
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(false)
  const [pushing, setPushing] = useState(false)
  const setCurrentPage = usePageStore((s) => s.setCurrentPage)
  const setCandidates = usePageStore((s) => s.setCandidates)
  const isOnline = useDeviceStore((s) => s.isOnline)
  const device = useDeviceStore((s) => s.device)
  const addEvent = useEventStore((s) => s.addEvent)

  const generate = async () => {
    if (!text.trim()) return; setLoading(true)
    try {
      const r = await api.generateQuest({ text, persona }); setQuest(r)
      addEvent({ type: "quest", message: `生成: ${r.mainQuest}` })
      const h = await api.getPageHistory(1); const p = h[0]
      if (p) { setPage(p); setCurrentPage(p); setCandidates([p]) }
    } catch (e) { addEvent({ type: "system", message: `失败: ${e}` }) }
    finally { setLoading(false) }
  }

  const push = async () => {
    if (!page || !device) return; setPushing(true)
    try { await api.pushPageToDevice(page.id, device.id); addEvent({ type: "system", message: "已推送" }) }
    catch { addEvent({ type: "alert", message: "推送失败" }) }
    finally { setPushing(false) }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="grid grid-cols-2 gap-5 min-h-[calc(100vh-180px)]">
          {/* Input */}
          <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none">
              <Sparkles size={15} className="text-purple" />输入待办
            </div>
            <div className="flex-1 flex flex-col p-4">
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                className="flex-1 w-full p-3 text-sm font-sans leading-relaxed text-ink-600 bg-white border border-ink-200 rounded placeholder:text-ink-300 resize-none focus:border-accent focus:ring-3 focus:ring-accent-light outline-none transition-all duration-150"
                placeholder={"写下今天要做的事...\n\n例如:\n1. 完成墨水屏自动刷新接口\n2. 修复二维码留言页面\n3. 晚上去健身"} />
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-ink-100">
                {/* Segmented control */}
                <div className="flex bg-ink-50 rounded p-0.5 gap-0.5">
                  {personas.map((p) => (
                    <button key={p} onClick={() => setPersona(p)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-100
                        ${persona === p ? "bg-white text-ink-700 shadow-sm" : "text-ink-400 hover:text-ink-500"}`}>
                      {pLabel[p]}
                    </button>
                  ))}
                </div>
                <button onClick={generate} disabled={!text.trim() || loading}
                  className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 text-sm font-medium rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-150">
                  <Sparkles size={14} />{loading ? "生成中..." : "生成卷轴"}
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none">预览</div>
            <div className="flex-1 flex flex-col p-4 overflow-auto">
              {quest ? (
                <>
                  <div className="flex-1 bg-ink-50 border border-ink-100 rounded-md p-4 font-mono text-xs leading-relaxed space-y-2.5 text-ink-500">
                    <div className="text-center text-purple"><div className="tracking-widest">DAILY QUEST / LV.01</div></div>
                    <div className="h-px bg-ink-100" />
                    <div><span className="text-ink-400">★ 主线 </span><span className="text-ink-700">{quest.mainQuest}</span></div>
                    {quest.sideQuests.length > 0 && <div><span className="text-ink-400">◆ 支线 </span>{quest.sideQuests.map((s, i) => <div key={i} className="text-ink-600">□ {s}</div>)}</div>}
                    <div className="h-px bg-ink-100" />
                    <div><span className="text-ink-400">☠ BOSS </span><span className="text-warning">{quest.bossName}</span><span className="text-ink-400">  弱点 </span><span className="text-ink-600">{quest.bossWeakness}</span></div>
                    <div className="h-px bg-ink-100" />
                    <div className="text-danger">🚫 {quest.ban}</div>
                    <div className="text-success">🏆 {quest.reward}</div>
                    <div className="h-px bg-ink-100" />
                    <div className="text-center text-purple">「{quest.declaration}」</div>
                  </div>
                  <button onClick={push} disabled={!isOnline || pushing}
                    className="inline-flex items-center justify-center gap-1.5 w-full h-[34px] mt-4 px-3.5 text-sm font-medium rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-150">
                    <Send size={14} />{pushing ? "推送中..." : isOnline ? "推送到墨水屏" : "设备离线"}
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="size-12 rounded-full bg-ink-50 flex items-center justify-center mb-4"><Sparkles size={24} className="text-ink-200" /></div>
                  <h3 className="text-sm font-medium text-ink-500 mb-1">输入待办，AI 生成任务卷轴</h3>
                  <p className="text-xs text-ink-400">支持 4 种 AI 人格风格</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
