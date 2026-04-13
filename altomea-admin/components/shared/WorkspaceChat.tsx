'use client'

import { useState } from 'react'

const models = [
  { id: 'claude', label: 'Claude', placeholder: 'Réponds en français, tu es consultant marketing pour restaurants...' },
  { id: 'gpt', label: 'ChatGPT', placeholder: 'Réponds en français, tu es consultant marketing pour restaurants...' },
]

export default function WorkspaceChat() {
  const [model, setModel] = useState('claude')
  const [system, setSystem] = useState('Tu es un expert en marketing digital pour restaurants en Suisse. Tu réponds toujours en français, de façon concise et orientée résultats.')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  async function send() {
    if (!message.trim() || loading) return
    const userMsg = message.trim()
    setMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, system, message: userMsg, apiKey, history: messages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response ?? data.error ?? 'Erreur.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion.' }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p
            className="text-xs tracking-[4px] uppercase mb-1"
            style={{ color: '#c9a84c' }}
          >
            IA
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: '#e8e8f0' }}>Espace IA</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {models.map(m => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`text-xs tracking-wider uppercase px-4 py-2 border transition-colors cursor-pointer ${
                  model === m.id
                    ? 'border-[#c9a84c]/40 text-[#c9a84c] bg-[#c9a84c]/[0.07]'
                    : 'border-white/10 hover:text-white/60'
                }`}
                style={model !== m.id ? { color: '#7a7a8e' } : undefined}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs border border-white/10 px-3 py-2 transition-colors cursor-pointer hover:text-white/60"
            style={{ color: '#7a7a8e' }}
          >
            ⚙
          </button>
        </div>
      </div>

      {showSettings && (
        <div
          className="border p-4 mb-4"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div className="mb-3">
            <label
              className="text-xs uppercase tracking-widest block mb-2"
              style={{ color: '#7a7a8e' }}
            >
              Clé API ({model === 'claude' ? 'Anthropic' : 'OpenAI'})
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full text-sm px-3 py-2 outline-none border transition-colors duration-200"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.07)',
                color: '#e8e8f0',
              }}
            />
          </div>
          <div>
            <label
              className="text-xs uppercase tracking-widest block mb-2"
              style={{ color: '#7a7a8e' }}
            >
              Prompt système
            </label>
            <textarea
              value={system}
              onChange={e => setSystem(e.target.value)}
              rows={3}
              className="w-full text-sm px-3 py-2 outline-none resize-none border transition-colors duration-200"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.07)',
                color: '#e8e8f0',
              }}
            />
          </div>
        </div>
      )}

      <div
        className="flex-1 border overflow-y-auto p-4 flex flex-col gap-4 min-h-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Commencez par entrer votre clé API dans les paramètres (⚙),
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
              puis posez votre question.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(201,168,76,0.2)' }}
              >
                <span className="text-[9px]" style={{ color: '#c9a84c' }}>IA</span>
              </div>
            )}
            <div
              className={`max-w-[80%] text-sm leading-relaxed px-4 py-3 border ${
                m.role === 'user' ? '' : ''
              }`}
              style={
                m.role === 'user'
                  ? {
                      background: 'rgba(201,168,76,0.1)',
                      borderColor: 'rgba(201,168,76,0.2)',
                      color: '#e8e8f0',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(255,255,255,0.07)',
                      color: 'rgba(232,232,240,0.8)',
                    }
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(201,168,76,0.2)' }}
            >
              <span className="text-[9px]" style={{ color: '#c9a84c' }}>IA</span>
            </div>
            <div
              className="border px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>...</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Écris une publication Instagram pour ce restaurant... (Entrée pour envoyer)"
          rows={2}
          className="flex-1 text-sm px-4 py-3 outline-none resize-none border transition-colors duration-200 placeholder:text-white/20"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.07)',
            color: '#e8e8f0',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
        />
        <button
          onClick={send}
          disabled={loading || !message.trim()}
          className="text-xs tracking-[2px] uppercase font-semibold px-5 hover:bg-[#b8943d] transition-colors cursor-pointer disabled:opacity-40 self-stretch"
          style={{ background: '#c9a84c', color: '#0a0a0f' }}
        >
          Envoyer
        </button>
      </div>
      <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.15)' }}>
        Shift+Entrée pour nouvelle ligne. La clé API n&apos;est pas sauvegardée.
      </p>
    </div>
  )
}
