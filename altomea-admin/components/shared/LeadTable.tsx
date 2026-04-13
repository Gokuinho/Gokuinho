'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from './StatusBadge'

export interface Lead {
  id: string
  name: string
  email: string
  restaurant: string
  message: string
  status: string
  notes: string
  createdAt: Date
}

const LEAD_STATUSES = ['nouveau', 'contacté', 'converti', 'perdu']

interface EditState {
  status: string
  notes: string
}

export default function LeadTable({ leads }: { leads: Lead[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ status: '', notes: '' })
  const [saving, setSaving] = useState(false)

  function openEdit(lead: Lead) {
    setEditingId(lead.id)
    setEditState({ status: lead.status, notes: lead.notes })
  }

  function closeEdit() {
    setEditingId(null)
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    await fetch(`/api/leads/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editState),
    })
    setSaving(false)
    closeEdit()
    router.refresh()
  }

  async function deleteLead(id: string) {
    if (!confirm('Supprimer cette demande ?')) return
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <>
      {leads.length === 0 ? (
        <div
          className="border p-10 text-center"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm" style={{ color: '#7a7a8e' }}>Aucune demande pour le moment.</p>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
          {leads.map(lead => (
            <div
              key={lead.id}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-200"
              style={{ background: '#0a0a0f' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0a0a0f')}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-0.5 truncate" style={{ color: '#e8e8f0' }}>
                  {lead.restaurant}
                </p>
                <p className="text-xs truncate" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
                  {lead.name} · {lead.email} · {formatDate(lead.createdAt)}
                </p>
                {lead.notes && (
                  <p className="text-xs mt-1 line-clamp-1" style={{ color: '#7a7a8e' }}>
                    {lead.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={lead.status} type="lead" />

                <button
                  onClick={() => openEdit(lead)}
                  className="text-xs tracking-wider uppercase px-3 py-1 border transition-colors duration-200 cursor-pointer"
                  style={{
                    color: '#c9a84c',
                    borderColor: 'rgba(201,168,76,0.3)',
                    background: 'rgba(201,168,76,0.06)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.12)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.06)'
                  }}
                >
                  Modifier
                </button>

                <button
                  onClick={() => deleteLead(lead.id)}
                  className="text-xs transition-colors duration-200 cursor-pointer"
                  style={{ color: 'rgba(239,68,68,0.5)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#f87171')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.5)')}
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) closeEdit() }}
        >
          <div
            className="w-full max-w-md p-6 border"
            style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-5"
              style={{ color: '#7a7a8e' }}
            >
              Modifier la demande
            </p>

            <div className="mb-4">
              <label
                className="text-xs uppercase tracking-widest block mb-2"
                style={{ color: '#7a7a8e' }}
              >
                Statut
              </label>
              <select
                value={editState.status}
                onChange={e => setEditState(s => ({ ...s, status: e.target.value }))}
                className="w-full text-sm px-3 py-2 outline-none border transition-colors duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.07)',
                  color: '#e8e8f0',
                }}
              >
                {LEAD_STATUSES.map(s => (
                  <option key={s} value={s} style={{ background: '#111118' }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label
                className="text-xs uppercase tracking-widest block mb-2"
                style={{ color: '#7a7a8e' }}
              >
                Notes
              </label>
              <textarea
                value={editState.notes}
                onChange={e => setEditState(s => ({ ...s, notes: e.target.value }))}
                rows={4}
                className="w-full text-sm px-3 py-2 outline-none resize-none border transition-colors duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.07)',
                  color: '#e8e8f0',
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="text-xs tracking-[3px] uppercase font-semibold px-5 py-2 transition-colors duration-200 cursor-pointer disabled:opacity-40"
                style={{ background: '#c9a84c', color: '#0a0a0f' }}
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button
                onClick={closeEdit}
                className="text-xs transition-colors duration-200 cursor-pointer"
                style={{ color: '#7a7a8e' }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
