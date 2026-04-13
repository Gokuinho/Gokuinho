'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  clientId: string
  senderRole: string
  content: string
  read: boolean
  createdAt: Date | string
}

interface Props {
  clientId: string
  clientName: string
  initialMessages: Message[]
}

export default function MessageThreadView({ clientId, clientName, initialMessages }: Props) {
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [initialMessages])

  // Mark messages as read on mount
  useEffect(() => {
    fetch('/api/messages/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
  }, [clientId])

  async function sendReply() {
    if (!reply.trim() || sending) return
    setSending(true)
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, content: reply.trim(), senderRole: 'admin' }),
    })
    setReply('')
    setSending(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div
        className="flex-1 overflow-y-auto border p-4 flex flex-col gap-3 min-h-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {initialMessages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: '#7a7a8e' }} className="text-sm">Aucun message dans ce thread.</p>
          </div>
        )}
        {initialMessages.map(m => (
          <div key={m.id} className={`flex ${m.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[75%] text-sm leading-relaxed px-4 py-3 border"
              style={
                m.senderRole === 'admin'
                  ? { background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.2)', color: '#e8e8f0' }
                  : { background: '#111118', borderColor: 'rgba(255,255,255,0.07)', color: '#e8e8f0' }
              }
            >
              {m.senderRole === 'client' && (
                <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-[10px] uppercase tracking-widest mb-1">
                  {clientName}
                </p>
              )}
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
        <textarea
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
          placeholder="Répondre au client... (Entrée pour envoyer)"
          rows={2}
          className="flex-1 text-sm px-4 py-3 outline-none resize-none"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#e8e8f0' }}
        />
        <button
          onClick={sendReply}
          disabled={sending || !reply.trim()}
          className="text-xs tracking-[2px] uppercase font-semibold px-5 transition-colors duration-200 disabled:opacity-40 cursor-pointer"
          style={{ background: '#c9a84c', color: '#0a0a0f' }}
        >
          {sending ? '...' : 'Envoyer'}
        </button>
      </div>
    </div>
  )
}
