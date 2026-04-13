'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Message { id: string; senderRole: string; content: string; createdAt: Date | string }

export default function ClientMessageThread({ clientId, initialMessages }: { clientId: string; initialMessages: Message[] }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [initialMessages])

  async function send() {
    if (!message.trim() || sending) return
    setSending(true)
    await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, content: message.trim(), senderRole: 'client' }) })
    setMessage(''); setSending(false); router.refresh()
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto border p-4 flex flex-col gap-3 min-h-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {initialMessages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
            <p style={{ color: '#7a7a8e' }} className="text-sm">Envoyez un message à Altomea.</p>
            <p style={{ color: '#7a7a8e' }} className="text-sm">Nous répondrons dans les plus brefs délais.</p>
          </div>
        )}
        {initialMessages.map(m => (
          <div key={m.id} className={`flex ${m.senderRole === 'client' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%] text-sm leading-relaxed px-4 py-3 border"
              style={m.senderRole === 'client'
                ? { background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.2)', color: '#e8e8f0' }
                : { background: '#111118', borderColor: 'rgba(255,255,255,0.07)', color: '#e8e8f0' }}>
              {m.senderRole === 'admin' && <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-[10px] uppercase tracking-widest mb-1">Altomea</p>}
              {m.content}
              <p style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-[10px] mt-1.5">
                {new Date(m.createdAt).toLocaleString('fr-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Votre message... (Entrée pour envoyer)" rows={2} className="flex-1 text-sm px-4 py-3 outline-none resize-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#e8e8f0' }} />
        <button onClick={send} disabled={sending || !message.trim()} className="text-xs tracking-[2px] uppercase font-semibold px-5 disabled:opacity-40 cursor-pointer" style={{ background: '#c9a84c', color: '#0a0a0f' }}>{sending ? '...' : 'Envoyer'}</button>
      </div>
    </>
  )
}
