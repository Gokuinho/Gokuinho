'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string; email: string; name: string; role: string
  active: boolean; clientStatus: string; createdAt: Date | string
}

const ROLES = ['admin', 'collaborateur', 'comptable', 'client']
const ROLE_COLORS: Record<string, string> = {
  admin: '#c9a84c', collaborateur: '#3b82f6', comptable: '#a855f7', client: '#22c55e'
}

export default function UserManager({ users: initialUsers }: { users: User[] }) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function changeRole(id: string, role: string) {
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    router.refresh()
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) })
    router.refresh()
  }

  async function createUser() {
    if (!form.email || !form.password || !form.role) { setError('Tous les champs sont requis.'); return }
    setCreating(true); setError('')
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur'); setCreating(false); return }
    setShowCreate(false); setForm({ name: '', email: '', password: '', role: 'client' })
    setCreating(false); router.refresh()
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="text-xs tracking-[2px] uppercase font-semibold px-5 py-2.5 transition-colors duration-200 cursor-pointer"
          style={{ background: '#c9a84c', color: '#0a0a0f' }}
        >
          + Nouvel utilisateur
        </button>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="grid grid-cols-5 px-5 py-3 text-[10px] tracking-widest uppercase" style={{ background: '#0a0a0f', color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
          <span>Nom</span><span>Email</span><span>Rôle</span><span>Statut</span><span>Actions</span>
        </div>
        {initialUsers.map(u => (
          <div key={u.id} className="grid grid-cols-5 items-center px-5 py-3.5" style={{ background: '#0a0a0f' }}>
            <span style={{ color: '#e8e8f0' }} className="text-sm">{u.name}</span>
            <span style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-xs truncate pr-2">{u.email}</span>
            <select
              value={u.role}
              onChange={e => changeRole(u.id, e.target.value)}
              className="text-xs px-2 py-1 outline-none cursor-pointer w-fit"
              style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', color: ROLE_COLORS[u.role] ?? '#e8e8f0', fontFamily: 'DM Mono, monospace' }}
            >
              {ROLES.map(r => <option key={r} value={r} style={{ color: '#e8e8f0', background: '#111118' }}>{r}</option>)}
            </select>
            <span
              className="text-[10px] px-2 py-0.5 border w-fit"
              style={u.active
                ? { color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', fontFamily: 'DM Mono, monospace' }
                : { color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', fontFamily: 'DM Mono, monospace' }
              }
            >
              {u.active ? 'Actif' : 'Inactif'}
            </span>
            <button
              onClick={() => toggleActive(u.id, !u.active)}
              className="text-xs transition-colors duration-200 cursor-pointer w-fit"
              style={{ color: '#7a7a8e' }}
            >
              {u.active ? 'Désactiver' : 'Réactiver'}
            </button>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md p-6 border" style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-lg font-semibold mb-5">Nouvel utilisateur</h3>
            {['name', 'email', 'password'].map(field => (
              <div key={field} className="mb-4">
                <label style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-xs uppercase tracking-widest block mb-2">{field}</label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  value={(form as Record<string, string>)[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full text-sm px-3 py-2 outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#e8e8f0' }}
                />
              </div>
            ))}
            <div className="mb-5">
              <label style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-xs uppercase tracking-widest block mb-2">Rôle</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full text-sm px-3 py-2 outline-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#e8e8f0' }}
              >
                {ROLES.map(r => <option key={r} value={r} style={{ background: '#111118' }}>{r}</option>)}
              </select>
            </div>
            {error && <p style={{ color: '#ef4444' }} className="text-xs mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={createUser}
                disabled={creating}
                className="flex-1 text-xs tracking-[2px] uppercase font-semibold py-2.5 disabled:opacity-40 cursor-pointer"
                style={{ background: '#c9a84c', color: '#0a0a0f' }}
              >
                {creating ? 'Création...' : 'Créer'}
              </button>
              <button onClick={() => setShowCreate(false)} style={{ color: '#7a7a8e' }} className="text-xs hover:text-[#e8e8f0] cursor-pointer px-4">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
