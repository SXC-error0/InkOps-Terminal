import { useState, useEffect } from "react"
import { MessageSquare, QrCode, Send } from "lucide-react"
import * as api from "#/lib/api"

interface MsgInfo { id: string; sender_name: string | null; text: string; created_at: string | null }

export function SignalsPage() {
  const [messages, setMessages] = useState<MsgInfo[]>([])
  const [qr, setQr] = useState<{ key: string; qrData: string; qrImagePath: string } | null>(null)
  const [sender, setSender] = useState(""); const [text, setText] = useState(""); const [sending, setSending] = useState(false)

  const loadMsg = async () => { try { setMessages(await api.getMessages(20) as MsgInfo[]) } catch { /* */ } }
  useEffect(() => { loadMsg() }, [])

  const handleSubmit = async () => {
    if (!text.trim()) return; setSending(true)
    try {
      const result = await api.submitMessage({ sender_name: sender || undefined, text }) as { approved: boolean; reason?: string; page_id?: string }
      if (result.approved) { setText(""); setSender(""); await loadMsg() }
      else { alert(`留言被拒绝: ${result.reason}`) }
    } catch { /* */ } finally { setSending(false) }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto p-6">
        <div className="grid grid-cols-2 gap-5">
          {/* 二维码 */}
          <div className="card">
            <div className="card-header">
              <QrCode size={15} style={{ color: "var(--color-warning)" }} />
              <span>留言二维码</span>
            </div>
            <div className="card-body text-center space-y-4">
              <QrCode size={80} style={{ color: "var(--color-text)", margin: "0 auto" }} />
              <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                生成专属留言入口, 访客扫码即可留言
              </p>
              <button
                onClick={async () => { try { setQr(await api.generateQrCode()) } catch { /* */ } }}
                className="btn btn-secondary"
              >
                <QrCode size={13} />生成二维码
              </button>
              {qr && (
                <div className="text-[11px] p-2 rounded" style={{ background: "var(--color-bg)", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", wordBreak: "break-all" }}>
                  {qr.qrData}
                </div>
              )}
            </div>
          </div>

          {/* 留言 */}
          <div className="card">
            <div className="card-header">
              <Send size={15} style={{ color: "var(--color-warning)" }} />
              <span>发送留言</span>
            </div>
            <div className="card-body space-y-3">
              <input value={sender} onChange={(e) => setSender(e.target.value)} className="input" placeholder="署名 (可选)" />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={80}
                className="input"
                placeholder="留言内容 (最多80字)"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{text.length}/80</span>
                <button onClick={handleSubmit} disabled={!text.trim() || sending} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }}>
                  <Send size={12} />{sending ? "发送中" : "发送"}
                </button>
              </div>
            </div>
          </div>

          {/* 留言列表 */}
          <div className="col-span-2 card">
            <div className="card-header">
              <MessageSquare size={15} style={{ color: "var(--color-text-muted)" }} />
              <span>最近留言 ({messages.length})</span>
            </div>
            <div className="card-body" style={{ maxHeight: 300, overflow: "auto" }}>
              {messages.length === 0 ? (
                <div className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>
                  <MessageSquare size={28} className="mx-auto mb-2 opacity-20" />
                  <span className="text-[13px]">暂无留言</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className="p-3 rounded-lg" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border-light)" }}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[12px] font-medium" style={{ color: "var(--color-accent)" }}>{m.sender_name ?? "匿名"}</span>
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{m.created_at?.slice(0, 16) ?? ""}</span>
                      </div>
                      <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{m.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
