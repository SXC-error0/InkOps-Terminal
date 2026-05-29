import { useState } from "react"
import { Sparkles } from "lucide-react"
import { usePageStore } from "#/stores/pageStore"
import { useEventStore } from "#/stores/eventStore"
import * as api from "#/lib/api"
import type { QuestPayload } from "#/lib/types"

const personas = ["guild", "commander", "instructor", "pet"] as const
const pLabel: Record<string, string> = { guild: "公会", commander: "舰桥", instructor: "教官", pet: "毒舌" }

export function QuestPage() {
  const [text, setText] = useState("")
  const [persona, setPersona] = useState<string>("guild")
  const [quest, setQuest] = useState<QuestPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const setCurrentPage = usePageStore((s) => s.setCurrentPage)
  const setCandidates = usePageStore((s) => s.setCandidates)
  const addEvent = useEventStore((s) => s.addEvent)

  const generate = async () => {
    if (!text.trim()) return; setLoading(true)
    try {
      const r = await api.generateQuest({ text, persona }); setQuest(r)
      addEvent({ type: "quest", message: `生成: ${r.mainQuest}` })
      const h = await api.getPageHistory(1); const p = h[0]
      if (p) { setCurrentPage(p); setCandidates([p]) }
    } catch (e) { addEvent({ type: "system", message: `失败: ${e}` }) }
    finally { setLoading(false) }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[calc(100vh-140px)]">
          
          {/* Input Panel */}
          <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50">
              <Sparkles size={13} className="text-purple" />
              任务熔炉系统
            </div>
            <div className="flex-1 flex flex-col p-5">
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                className="flex-1 w-full p-4 text-xs font-mono leading-relaxed text-ink-700 bg-ink-50 border border-ink-200 rounded placeholder:text-ink-300 resize-none outline-none transition-all duration-200"
                placeholder={"写下你今天的待办事项...\n\n例如：\n1. 完成电子墨水屏刷新 API 编写\n2. 修复留言箱的二维码入口\n3. 晚上 8 点去健身房力量训练"} />
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 mt-5 border-t border-ink-100">
                {/* Custom Segmented Control */}
                <div className="grid grid-cols-4 bg-ink-100 rounded p-1 gap-1 border border-ink-200 min-w-[200px]">
                  {personas.map((p) => (
                    <button key={p} onClick={() => setPersona(p)}
                      className={`text-center py-1.5 text-[11px] font-mono font-bold uppercase rounded-sm transition-all duration-150 cursor-pointer select-none whitespace-nowrap
                        ${persona === p ? "bg-accent text-white shadow-sm" : "text-ink-400 hover:text-ink-500"}`}>
                      {pLabel[p]}
                    </button>
                  ))}
                </div>
                
                <button onClick={generate} disabled={!text.trim() || loading}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-5 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-purple text-white hover:bg-purple-strong disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-purple/20 hover:scale-[1.02] active:scale-95">
                  <Sparkles size={13} />
                  {loading ? "熔炼中..." : "熔炼任务"}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50">
              效果预览舱
            </div>
            <div className="flex-1 flex flex-col p-5 justify-between">
              {quest ? (
                <div className="rpg-scroll flex-1 rounded p-6 font-mono text-xs leading-relaxed space-y-4">
                  <div className="text-center text-[#c29d6d] font-bold"><div className="tracking-widest">// 每日任务 // 等级 LV.01</div></div>
                  <div className="h-px bg-[#c29d6d]/20" />
                  <div><span className="text-[#a5865e]">★ 主线任务：</span><span className="text-white font-bold">{quest.mainQuest}</span></div>
                  {quest.sideQuests.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[#a5865e]">◆ 支线任务：</span>
                      {quest.sideQuests.map((s, i) => <div key={i} className="text-[#ebd7bd]/80 pl-4">□ {s}</div>)}
                    </div>
                  )}
                  <div className="h-px bg-[#c29d6d]/20" />
                  <div className="flex flex-wrap gap-x-4">
                    <div><span className="text-[#a5865e]">☠ 领主：</span><span className="text-warning font-bold">{quest.bossName}</span></div>
                    <div><span className="text-[#a5865e]">弱点：</span><span className="text-[#ebd7bd]/80">{quest.bossWeakness}</span></div>
                  </div>
                  <div className="h-px bg-[#c29d6d]/20" />
                  <div className="text-danger font-bold">🚫 禁忌：{quest.ban}</div>
                  <div className="text-success font-bold">🏆 奖励：{quest.reward}</div>
                  <div className="h-px bg-[#c29d6d]/20" />
                  <div className="text-center text-[#a855f7]/90 italic">「{quest.declaration}」</div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <div className="size-12 rounded-full bg-ink-50 flex items-center justify-center mb-4 border border-ink-100">
                    <Sparkles size={20} className="text-ink-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink-700 uppercase font-mono tracking-wider">预览舱为空</h3>
                  <p className="text-xs text-ink-400 mt-1.5 max-w-xs">生成待办任务，即可将你今天的待办转化为奇幻 RPG 冒险任务板，并同步推送到墨水屏设备。</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
