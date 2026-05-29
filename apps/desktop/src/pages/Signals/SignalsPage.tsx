import { useState, useEffect } from "react"
import { MessageSquare, QrCode, Send } from "lucide-react"
import * as api from "#/lib/api"

interface Msg { id: string; sender_name: string | null; text: string; created_at: string | null }

export function SignalsPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]); const [qr, setQr] = useState<{ key: string; qrData: string } | null>(null)
  const [sender, setSender] = useState(""); const [text, setText] = useState(""); const [sending, setSending] = useState(false)
  const load = async () => { try { setMsgs(await api.getMessages(20) as Msg[]) } catch { /* */ } }
  useEffect(() => { load() }, [])
  const submit = async () => { if (!text.trim()) return; setSending(true); try { const r = await api.submitMessage({ sender_name: sender || undefined, text }) as { approved: boolean; reason?: string }; if (r.approved) { setText(""); setSender(""); await load() } else { alert(`被拒绝: ${r.reason}`) } } catch { /* */ } finally { setSending(false) } }

  return (
    <div className="h-full overflow-auto"><div className="p-6"><div className="max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none"><QrCode size={15} className="text-warning" />留言二维码</div>
          <div className="p-5 text-center space-y-4">
            <QrCode size={72} className="mx-auto text-ink-200" />
            <p className="text-xs text-ink-400">生成专属留言入口二维码</p>
            <button onClick={async () => { try { const r = await api.generateQrCode(); setQr({ key: r.key, qrData: r.qrData }) } catch { /* */ } }} className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 text-sm font-medium rounded cursor-pointer select-none bg-white text-ink-500 border border-ink-200 hover:bg-ink-50 transition-colors"><QrCode size={12} />生成</button>
            {qr && <div className="text-[11px] p-2 rounded bg-ink-50 border border-ink-100 font-mono break-all">{qr.qrData}</div>}
          </div>
        </div>
        <div className="bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none"><Send size={15} className="text-warning" />发送留言</div>
          <div className="p-5 space-y-3">
            <input value={sender} onChange={(e) => setSender(e.target.value)} className="w-full h-[34px] px-2.5 text-sm font-sans text-ink-600 bg-white border border-ink-200 rounded placeholder:text-ink-300 focus:border-accent focus:ring-3 focus:ring-accent-light outline-none transition-all" placeholder="署名 (可选)" />
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} className="w-full h-[34px] px-2.5 text-sm font-sans text-ink-600 bg-white border border-ink-200 rounded placeholder:text-ink-300 focus:border-accent focus:ring-3 focus:ring-accent-light outline-none transition-all" placeholder="留言内容 (最多80字)" onKeyDown={(e) => e.key === "Enter" && submit()} />
            <div className="flex items-center justify-between"><span className="text-[11px] text-ink-400">{text.length}/80</span><button onClick={submit} disabled={!text.trim() || sending} className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 text-sm font-medium rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong disabled:opacity-35 transition-colors"><Send size={11} />{sending ? "发送中" : "发送"}</button></div>
          </div>
        </div>
        <div className="col-span-2 bg-white border border-ink-200 rounded-lg shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-sm font-semibold text-ink-500 select-none"><MessageSquare size={15} className="text-ink-400" />最近留言 ({msgs.length})</div>
          <div className="overflow-auto max-h-[220px]">
            {msgs.length === 0 ? <div className="flex flex-col items-center py-10 text-center"><div className="size-10 rounded-full bg-ink-50 flex items-center justify-center mb-3"><MessageSquare size={20} className="text-ink-200" /></div><h3 className="text-sm font-medium text-ink-500">暂无留言</h3></div> : (
              <div className="p-4 space-y-1.5">{msgs.map((m) => (
                <div key={m.id} className="px-4 py-3 rounded-md bg-ink-50 border border-ink-100"><div className="flex justify-between mb-1"><span className="text-[12px] font-medium text-accent">{m.sender_name ?? "匿名"}</span><span className="text-[10px] text-ink-400">{m.created_at?.slice(0, 16) ?? ""}</span></div><p className="text-xs text-ink-500">{m.text}</p></div>
              ))}</div>
            )}
          </div>
        </div>
      </div>
    </div></div></div>
  )
}
