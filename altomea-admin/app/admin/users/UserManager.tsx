'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string; email: string; name: string; role: string
  active: boolean; clientStatus: string; restaurant: string; city: string; createdAt: Date | string
}

const ROLES = ['admin', 'collaborateur', 'comptable', 'client']

const ROLE_STYLE = {
  background: 'rgba(201,168,76,0.15)',
  color: '#c9a84c',
  borderColor: 'rgba(201,168,76,0.3)',
}

function generatePassword(length = 12): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

type FormState = { name: string; email: string; restaurant: string; city: string; role: string; password: string }

const EMPTY_FORM: FormState = { name: '', email: '', restaurant: '', city: '', role: 'client', password: '' }

export default function UserManager({ users: initialUsers }: { users: User[] }) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const openCreate = useCallback(() => {
    setForm({ ...EMPTY_FORM, password: generatePassword() })
    setError('')
    setCreatedPassword(null)
    setShowCreate(true)
  }, [])

  async function changeRole(id: string, role: string) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    router.refresh()
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    router.refresh()
  }

  async function createUser() {
    if (!form.email || !form.password || !form.role) {
      setError('Email, rôle et mot de passe sont requis.')
      return
    }
    setCreating(true)
    setError('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Erreur lors de la création.')
      setCreating(false)
      return
    }
    setCreatedPassword(form.password)
    setCreating(false)
    router.refresh()
  }

  async function copyPassword() {
    if (!createdPassword) return
    await navigator.clipboard.writeText(createdPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function closeModal() {
    setShowCreate(false)
    setForm(EMPTY_FORM)
    setCreatedPassword(null)
    setError('')
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="text-xs tracking-[2px] uppercase font-semibold px-5 py-2.5 transition-colors duration-200 cursor-pointer"
          style={{ background: '#c9a84c', color: '#0a0a0f' }}
        >
          + Nouvel utilisateur
        </button>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {/* Header */}
        <div
          className="grid px-5 py-3 text-[10px] tracking-widest uppercase"
          style={{ background: '#0a0a0f', color: '#7a7a8e', fontFamily: 'DM Mono, monospace', gridTemplateColumns: '1fr 1fr 1fr 120px 160px' }}
        >
          <span>Nom</span>
          <span>Email</span>
          <span>Restaurant</span>
          <span>Rôle</span>
          <span>Statut / Action</span>
        </div>

        {initialUsers.map(u => (
          <div
            key={u.id}
            className="grid items-center px-5 py-3.5"
            style={{ background: '#0a0a0f', gridTemplateColumns: '1fr 1fr 1fr 120px 160px' }}
          >
            {/* Nom */}
            <div className="min-w-0 pr-2">
              <p className="text-sm truncate" style={{ color: '#e8e8f0' }}>{u.name || '—'}</p>
              {u.city && <p className="text-[11px] truncate" style={{ color: '#7a7a8e' }}>{u.city}</p>}
            </div>

            {/* Email */}
            <span
              className="text-xs truncate pr-2"
              style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}
            >
              {u.email}
            </span>

            {/* Restaurant */}
            <span className="text-sm truncate pr-2" style={{ color: '#7a7a8e' }}>
              {u.restaurant || '—'}
            </span>

            {/* Rôle */}
            <select
              value={u.role}
              onChange={e => changeRole(u.id, e.target.value)}
              className="text-[10px] px-2 py-1 outline-none cursor-pointer w-fit border uppercase tracking-widest"
              style={{
                ...ROLE_STYLE,
                background: 'rgba(201,168,76,0.1)',
                fontFamily: 'DM Mono, monospace',
              }}
            >
              {ROLES.map(r => (
                <option key={r} value={r} style={{ color: '#e8e8f0', background: '#111118' }}>
                  {r}
                </option>
              ))}
            </select>

            {/* Statut + Action */}
            <div className="flex items-center gap-3">
              <span
                className="text-[10px] px-2 py-0.5 border w-fit"
                style={
                  u.active
                    ? { color: '#c9a84c', borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.1)', fontFamily: 'DM Mono, monospace' }
                    : { color: '#7a7a8e', borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', fontFamily: 'DM Mono, monospace' }
                }
              >
                {u.active ? 'Actif' : 'Inactif'}
              </span>
              <button
                onClick={() => toggleActive(u.id, !u.active)}
                className="text-xs transition-colors duration-200 cursor-pointer hover:text-[#e8e8f0]"
                style={{ color: '#7a7a8e' }}
              >
                {u.active ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg p-6 border"
            style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}
            onClick={e => e.stopPropagation()}
          >
            {createdPassword ? (
              /* ── Success state: show temp password ── */
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <span style={{ color: '#c9a84c' }}>✓</span>
                  <h3 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-lg font-semibold">
                    Compte créé
                  </h3>
                </div>
                <p className="text-sm mb-5" style={{ color: '#7a7a8e' }}>
                  Un email de bienvenue a été envoyé à <span style={{ color: '#e8e8f0' }}>{form.email}</span> avec les identifiants de connexion.
                </p>

                {/* Password reveal */}
                <div className="mb-4 border" style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.06)' }}>
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
                      Mot de passe temporaire
                    </p>
                    <p className="text-xl font-medium mb-3" style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>
                      {createdPassword}
                    </p>
                  </div>
                  <div className="border-t px-4 py-2.5" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
                    <button
                      onClick={copyPassword}
                      className="text-xs tracking-widest uppercase cursor-pointer transition-colors duration-200"
                      style={{ color: copied ? '#c9a84c' : '#7a7a8e' }}
                    >
                      {copied ? '✓ Copié' : 'Copier le mot de passe'}
                    </button>
                  </div>
                </div>

                <p className="text-xs mb-5" style={{ color: '#7a7a8e', lineHeight: 1.6 }}>
                  Ce mot de passe est à communiquer au client. Il pourra le modifier depuis son espace après connexion.
                </p>

                <button
                  onClick={closeModal}
                  className="w-full text-xs tracking-[2px] uppercase font-semibold py-2.5 cursor-pointer"
                  style={{ background: '#c9a84c', color: '#0a0a0f' }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              /* ── Create form ── */
              <div>
                <h3 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-lg font-semibold mb-5">
                  Nouvel utilisateur
                </h3>

                {/* Grid: 2 cols */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { key: 'name', label: 'Nom complet', type: 'text', full: false },
                    { key: 'email', label: 'Email', type: 'email', full: false },
                    { key: 'restaurant', label: 'Nom du restaurant', type: 'text', full: false },
                    { key: 'city', label: 'Ville', type: 'text', full: false },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label
                        style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}
                        className="text-[10px] uppercase tracking-widest block mb-1.5"
                      >
                        {label}
                      </label>
                      <input
                        type={type}
                        value={(form as Record<string, string>)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full text-sm px-3 py-2 outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          color: '#e8e8f0',
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Rôle */}
                <div className="mb-4">
                  <label
                    style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}
                    className="text-[10px] uppercase tracking-widest block mb-1.5"
                  >
                    Rôle
                  </label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full text-sm px-3 py-2 outline-none cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#c9a84c',
                      fontFamily: 'DM Mono, monospace',
                    }}
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r} style={{ background: '#111118', color: '#e8e8f0' }}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mot de passe temporaire */}
                <div className="mb-5">
                  <label
                    style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}
                    className="text-[10px] uppercase tracking-widest block mb-1.5"
                  >
                    Mot de passe temporaire
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="flex-1 text-sm px-3 py-2 outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: '#c9a84c',
                        fontFamily: 'DM Mono, monospace',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                      className="text-[10px] uppercase tracking-widest px-3 py-2 cursor-pointer border transition-colors duration-200 hover:border-[rgba(201,168,76,0.4)]"
                      style={{ borderColor: 'rgba(255,255,255,0.07)', color: '#7a7a8e' }}
                    >
                      Regénérer
                    </button>
                  </div>
                </div>

                {error && (
                  <p style={{ color: '#ef4444' }} className="text-xs mb-3">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={createUser}
                    disabled={creating}
                    className="flex-1 text-xs tracking-[2px] uppercase font-semibold py-2.5 disabled:opacity-40 cursor-pointer"
                    style={{ background: '#c9a84c', color: '#0a0a0f' }}
                  >
                    {creating ? 'Création...' : 'Créer le compte'}
                  </button>
                  <button
                    onClick={closeModal}
                    className="text-xs px-4 cursor-pointer transition-colors duration-200 hover:text-[#e8e8f0]"
                    style={{ color: '#7a7a8e' }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
