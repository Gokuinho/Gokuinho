'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Prompt {
  id: string
  title: string
  category: string
  content: string
  tags: string
}

const categories = ['général', 'réseaux sociaux', 'google', 'publicité', 'email', 'stratégie']

export default function PromptsClient({ prompts }: { prompts: Prompt[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('général')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('tous')

  const filtered = activeCategory === 'tous'
    ? prompts
    : prompts.filter(p => p.category === activeCategory)

  async function save() {
    if (!title || !content) return
    setSaving(true)
    await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, content, tags }),
    })
    setSaving(false)
    setShowForm(false)
    setTitle(''); setContent(''); setTags('')
    router.refresh()
  }

  async function deletePrompt(id: string) {
    if (!confirm('Supprimer ce prompt ?')) return
    await fetch('/api/prompts/' + id, { method: 'DELETE' })
    router.refresh()
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {['tous', ...categories].map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`text-xs tracking-wider uppercase px-3 py-1.5 border transition-colors cursor-pointer ${
              activeCategory === c
                ? 'border-[#c9a84c]/40 text-[#c9a84c] bg-[#c9a84c]/[0.07]'
                : 'border-white/10 hover:text-white/60'
            }`}
            style={activeCategory !== c ? { color: '#7a7a8e' } : undefined}
          >
            {c}
          </button>
        ))}
        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto text-xs tracking-[2px] uppercase font-semibold px-4 py-1.5 hover:bg-[#b8943d] transition-colors cursor-pointer"
          style={{ background: '#c9a84c', color: '#0a0a0f' }}
        >
          + Nouveau prompt
        </button>
      </div>

      {showForm && (
        <div
          className="border p-5 mb-6"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className="text-xs uppercase tracking-widest block mb-2"
                style={{ color: '#7a7a8e' }}
              >
                Titre
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Rédiger une publication Instagram"
                className="w-full text-sm px-3 py-2 outline-none border transition-colors duration-200 placeholder:text-white/20"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.07)',
                  color: '#e8e8f0',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              />
            </div>
            <div>
              <label
                className="text-xs uppercase tracking-widest block mb-2"
                style={{ color: '#7a7a8e' }}
              >
                Catégorie
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-sm px-3 py-2 outline-none border transition-colors duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.07)',
                  color: '#e8e8f0',
                }}
              >
                {categories.map(c => (
                  <option key={c} value={c} style={{ background: '#111118' }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label
              className="text-xs uppercase tracking-widest block mb-2"
              style={{ color: '#7a7a8e' }}
            >
              Contenu du prompt
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              placeholder="Écris une publication Instagram pour un restaurant [type] situé à [ville]..."
              className="w-full text-sm px-3 py-2 outline-none resize-none border transition-colors duration-200 placeholder:text-white/20"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.07)',
                color: '#e8e8f0',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving || !title || !content}
              className="text-xs tracking-[2px] uppercase font-semibold px-5 py-2 hover:bg-[#b8943d] transition-colors cursor-pointer disabled:opacity-40"
              style={{ background: '#c9a84c', color: '#0a0a0f' }}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs hover:text-white/60 cursor-pointer transition-colors duration-200"
              style={{ color: '#7a7a8e' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div
          className="border p-10 text-center"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm" style={{ color: '#7a7a8e' }}>Aucun prompt dans cette catégorie.</p>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
          {filtered.map(p => (
            <div
              key={p.id}
              className="p-5 hover:bg-white/[0.02] transition-colors"
              style={{ background: '#0a0a0f' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium text-sm" style={{ color: '#e8e8f0' }}>{p.title}</p>
                    <span
                      className="text-[10px] px-2 py-0.5 uppercase tracking-wider border"
                      style={{ color: 'rgba(201,168,76,0.6)', borderColor: 'rgba(201,168,76,0.2)' }}
                    >
                      {p.category}
                    </span>
                  </div>
                  <p
                    className="text-xs leading-relaxed line-clamp-3"
                    style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}
                  >
                    {p.content}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => copy(p.content, p.id)}
                    className="text-xs px-3 py-1 border hover:border-[#c9a84c]/30 transition-colors cursor-pointer"
                    style={{
                      color: copied === p.id ? '#c9a84c' : 'rgba(201,168,76,0.5)',
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    {copied === p.id ? 'Copié ✓' : 'Copier'}
                  </button>
                  <button
                    onClick={() => deletePrompt(p.id)}
                    className="text-xs hover:text-red-400/70 transition-colors cursor-pointer"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
