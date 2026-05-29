import { useState, useEffect } from "react"
import { MessageSquare, QrCode, Send } from "lucide-react"
import * as api from "#/lib/api"

interface Msg { id: string; sender_name: string | null; text: string; created_at: string | null }

export function SignalsPage() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [qr, setQr] = useState<{ key: string; qrData: string } | null>(null)
  const [sender, setSender] = useState("")
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  const load = async () => {
    try {
      setMsgs((await api.getMessages(20)) as Msg[])
    } catch {
      // Ignored
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const r = (await api.submitMessage({ sender_name: sender || undefined, text })) as {
        approved: boolean
        reason?: string
      }
      if (r.approved) {
        setText("")
        setSender("")
        await load()
      } else {
        alert(`发送失败被拒绝: ${r.reason}`)
      }
    } catch {
      // Ignored
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Title and stats summary */}
        <div className="flex flex-col gap-1 border-b border-ink-100 pb-4">
          <h1 className="text-xs font-mono font-bold tracking-widest text-ink-700 uppercase">
            // 访客留言通道
          </h1>
          <p className="text-[11px] text-ink-400 font-sans">
            生成独立 QR 二维码供移动端扫码快速留言，或在控制台快捷调度发送自定义消息。
          </p>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: QR and Send Control (width 5/12) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* QR Portal Card */}
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50 select-none">
                <QrCode size={13} className="text-warning" />
                留言箱扫码通道网关
              </div>
              <div className="p-5 flex-1 flex flex-col items-center justify-between text-center space-y-4">
                <div className="p-3 bg-white/5 rounded border border-ink-100/50 relative group">
                  <QrCode size={80} className="mx-auto text-ink-300 group-hover:text-accent transition-colors duration-300" />
                  <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center font-mono text-[9px] text-accent font-bold uppercase tracking-widest pointer-events-none">
                    [ 扫描区域 ]
                  </div>
                </div>
                <p className="text-xs text-ink-400 max-w-[220px]">生成宾客留言专用的唯一 QR 二维码网关地址。</p>
                <button 
                  onClick={async () => { 
                    try { 
                      const r = await api.generateQrCode()
                      setQr({ key: r.key, qrData: r.qrData }) 
                    } catch { /* */ } 
                  }} 
                  className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-5 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-ink-50 text-ink-600 border border-ink-200 hover:bg-ink-150 hover:border-accent/40 transition-all duration-200"
                >
                  <QrCode size={12} />
                  生成扫码通道
                </button>
                {qr && (
                  <div className="text-[10px] w-full p-2.5 rounded bg-ink-50 border border-ink-100 font-mono break-all text-ink-400 uppercase tracking-tight">
                    {qr.qrData}
                  </div>
                )}
              </div>
            </div>

            {/* Send Message Card */}
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50 select-none">
                <Send size={13} className="text-accent-strong" />
                控制台发送留言
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <input 
                    value={sender} 
                    onChange={(e) => setSender(e.target.value)} 
                    className="w-full h-9 px-3 text-xs font-mono rounded placeholder:text-ink-300 outline-none transition-all duration-200" 
                    placeholder="发送人昵称 (选填)" 
                  />
                  <input 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    maxLength={80} 
                    className="w-full h-9 px-3 text-xs font-mono rounded placeholder:text-ink-300 outline-none transition-all duration-200" 
                    placeholder="消息内容 (最大支持 80 字符)" 
                    onKeyDown={(e) => e.key === "Enter" && submit()} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-ink-400 uppercase">{text.length} / 80 字符</span>
                  <button 
                    onClick={submit} 
                    disabled={!text.trim() || sending} 
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-5 text-xs font-mono font-bold uppercase tracking-wider rounded cursor-pointer select-none bg-accent text-white hover:bg-accent-strong disabled:opacity-30 transition-all duration-200"
                  >
                    <Send size={11} />
                    {sending ? "发送中..." : "立即发送"}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Inbox Feed (width 7/12) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="cyber-card rounded-lg overflow-hidden flex flex-col min-h-[500px]">
              <div className="flex items-center gap-2 h-11 px-5 border-b border-ink-100 text-xs font-mono tracking-wider font-bold text-ink-700 uppercase bg-ink-50/50 select-none">
                <MessageSquare size={13} className="text-accent" />
                收件箱已接收留言 ({msgs.length})
              </div>
              <div className="overflow-y-auto p-5 divide-y divide-ink-100/40">
                {msgs.length === 0 ? (
                  <div className="flex flex-col items-center py-20 text-center">
                    <div className="size-10 rounded-full bg-ink-50 flex items-center justify-center mb-3 border border-ink-100">
                      <MessageSquare size={16} className="text-ink-300" />
                    </div>
                    <h3 className="text-xs font-semibold text-ink-700 uppercase font-mono tracking-wider">收件箱无留言</h3>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {msgs.map((m) => (
                      <div key={m.id} className="p-3.5 rounded bg-ink-50 border border-ink-100 hover:border-ink-200 transition-all duration-200">
                        <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
                          <span className="font-bold text-accent-strong uppercase tracking-wider">发送人 // {m.sender_name ?? "匿名宾客"}</span>
                          <span className="text-ink-300">{m.created_at?.slice(0, 16).replace("T", " ") ?? ""}</span>
                        </div>
                        <p className="text-xs text-ink-650 font-sans leading-relaxed mt-1">{m.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
