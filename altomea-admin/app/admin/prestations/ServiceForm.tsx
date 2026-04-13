'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Service {
  id: string
  name: string
  description: string
  category: string
  unitPrice: number
  unit: string
  active: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  reseaux_sociaux: 'Réseaux sociaux',
  visibilite_locale: 'Visibilité locale',
  publicite: 'Publicité',
  contenu: 'Contenu',
  site_web: 'Site web',
  fidelisation: 'Fidélisation',
  autre: 'Autre',
}

const UNIT_LABELS: Record<string, string> = {
  mois: '/mois',
  heure: '/heure',
  forfait: 'forfait',
  post: '/post',
  piece: '/pièce',
}

const inputStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  color: '#e8e8f0',
  outline: 'none',
  width: '100%',
  padding: '8px 12px',
  fontSize: '14px',
}

const labelStyle = {
  color: '#7a7a8e',
  fontFamily: 'DM Mono, monospace',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  display: 'block',
  marginBottom: '6px',
}

export default function ServiceForm({ service }: { service?: Service | null }) {
  const router = useRouter()
  const isEdit = !!service

  const [name, setName] = useState(service?.name ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [category, setCategory] = useState(service?.category ?? 'autre')
  const [unitPrice, setUnitPrice] = useState<number>(service?.unitPrice ?? 0)
  const [unit, setUnit] = useState(service?.unit ?? 'forfait')
  const [active, setActive] = useState(service?.active ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Le nom est requis.')
      return
    }
    setLoading(true)
    setError(null)

    const body = { name: name.trim(), description, category, unitPrice, unit, active }

    try {
      const res = await fetch(
        isEdit ? `/api/prestations/${service.id}` : '/api/prestations',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Une erreur est survenue.')
        return
      }
      router.push('/admin/prestations')
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!service) return
    if (!window.confirm(`Supprimer "${service.name}" ? Cette action est irréversible.`)) return
    setLoading(true)
    try {
      await fetch(`/api/prestations/${service.id}`, { method: 'DELETE' })
      router.push('/admin/prestations')
    } catch {
      setError('Erreur lors de la suppression.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="p-6 mb-4"
        style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex flex-col gap-5">
          {/* Nom */}
          <div>
            <label style={labelStyle}>Nom *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Community management mensuel"
              style={inputStyle}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Description de la prestation..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Catégorie */}
          <div>
            <label style={labelStyle}>Catégorie *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={inputStyle}
              required
            >
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val} style={{ background: '#111118', color: '#e8e8f0' }}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Prix + Unité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Prix unitaire CHF *</label>
              <input
                type="number"
                value={unitPrice}
                onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Unité *</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                style={inputStyle}
                required
              >
                {Object.entries(UNIT_LABELS).map(([val, label]) => (
                  <option key={val} value={val} style={{ background: '#111118', color: '#e8e8f0' }}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statut actif */}
          <div>
            <label style={labelStyle}>Statut</label>
            <label
              className="flex items-center gap-3 cursor-pointer"
              style={{ color: active ? '#c9a84c' : '#7a7a8e', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}
            >
              <span
                onClick={() => setActive(!active)}
                className="relative inline-block w-10 h-5 cursor-pointer"
              >
                <span
                  className="block w-10 h-5 transition-colors duration-200"
                  style={{
                    background: active ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${active ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                />
                <span
                  className="absolute top-0.5 transition-all duration-200"
                  style={{
                    left: active ? '21px' : '2px',
                    width: '14px',
                    height: '14px',
                    background: active ? '#c9a84c' : '#7a7a8e',
                  }}
                />
              </span>
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="sr-only"
              />
              {active ? 'Actif' : 'Inactif'}
            </label>
          </div>
        </div>
      </div>

      {error && (
        <p
          className="text-sm mb-4 px-4 py-3"
          style={{
            color: '#f87171',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={loading}
          className="text-xs tracking-[3px] uppercase font-semibold px-6 py-2.5 transition-colors duration-200"
          style={{
            background: loading ? 'rgba(201,168,76,0.5)' : '#c9a84c',
            color: '#0a0a0f',
            fontFamily: 'DM Mono, monospace',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer la prestation'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-xs uppercase tracking-[2px] transition-colors duration-200"
            style={{
              color: '#f87171',
              fontFamily: 'DM Mono, monospace',
              background: 'transparent',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Supprimer cette prestation
          </button>
        )}
      </div>
    </form>
  )
}
