'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuoteItem {
  description: string
  quantity: number
  unitPrice: number
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  color: '#e8e8f0',
  fontFamily: 'DM Sans, sans-serif',
  width: '100%',
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  color: '#7a7a8e',
  fontFamily: 'DM Mono, monospace',
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.15em',
  display: 'block',
  marginBottom: 4,
}

const sectionHeaderStyle: React.CSSProperties = {
  color: '#7a7a8e',
  fontFamily: 'DM Mono, monospace',
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.15em',
  marginBottom: 12,
  paddingBottom: 10,
  borderBottom: '1px solid rgba(255,255,255,0.07)',
}

function getDefaultValidUntil(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export default function QuoteCreateForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Client fields
  const [clientName, setClientName] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [city, setCity] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  // Items
  const [items, setItems] = useState<QuoteItem[]>([{ description: '', quantity: 1, unitPrice: 0 }])

  // TVA & details
  const [tva, setTva] = useState(7.7)
  const [validUntil, setValidUntil] = useState(getDefaultValidUntil())
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('brouillon')

  // Computed totals
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
  const tvaAmount = subtotal * (tva / 100)
  const total = subtotal + tvaAmount

  function updateItem(index: number, field: keyof QuoteItem, value: string | number) {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function submit(overrideStatus?: string) {
    if (submitting) return
    setSubmitting(true)
    const finalStatus = overrideStatus ?? status
    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          restaurantName,
          city,
          clientEmail,
          items: JSON.stringify(items),
          subtotal,
          tva,
          total,
          validUntil,
          notes,
          status: finalStatus,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Erreur lors de la création du devis')
        return
      }
      const data = await res.json()
      router.push(`/admin/devis/${data.id}`)
    } catch {
      alert('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="border p-6"
      style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Section Client */}
      <div className="mb-8">
        <p style={sectionHeaderStyle}>Client</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Nom du client *</label>
            <input
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Jean Dupont"
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Restaurant</label>
            <input
              value={restaurantName}
              onChange={e => setRestaurantName(e.target.value)}
              placeholder="Le Bistrot"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Ville</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Lausanne"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              placeholder="client@example.com"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Section Prestations */}
      <div className="mb-8">
        <p style={sectionHeaderStyle}>Prestations</p>
        <div className="space-y-2">
          {/* Header row */}
          <div
            className="grid gap-3 text-[10px] uppercase tracking-widest pb-2"
            style={{
              color: '#7a7a8e',
              fontFamily: 'DM Mono, monospace',
              gridTemplateColumns: '1fr 80px 112px 112px 28px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <span>Description</span>
            <span>Qté</span>
            <span>Prix unit.</span>
            <span>Total</span>
            <span></span>
          </div>

          {items.map((item, i) => (
            <div
              key={i}
              className="grid gap-3 items-center"
              style={{ gridTemplateColumns: '1fr 80px 112px 112px 28px' }}
            >
              <input
                placeholder="Description de la prestation"
                value={item.description}
                onChange={e => updateItem(i, 'description', e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                min="0"
                step="1"
                value={item.quantity}
                onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}
              />
              <span
                style={{
                  color: '#c9a84c',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 13,
                  textAlign: 'right',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  padding: '8px 12px',
                  display: 'block',
                }}
              >
                {(item.quantity * item.unitPrice).toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={items.length <= 1}
                style={{
                  color: '#f87171',
                  fontSize: 18,
                  lineHeight: 1,
                  opacity: items.length <= 1 ? 0.25 : 1,
                  cursor: items.length <= 1 ? 'default' : 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textAlign: 'center',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-3 text-[11px] tracking-widest uppercase px-3 py-1.5 transition-colors duration-200"
          style={{
            color: '#7a7a8e',
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          + Ajouter une ligne
        </button>
      </div>

      {/* Section Totaux */}
      <div className="mb-8">
        <p style={sectionHeaderStyle}>Totaux</p>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-10 text-sm" style={{ color: '#7a7a8e' }}>
            <span>Sous-total HT</span>
            <span style={{ fontFamily: 'DM Mono, monospace', minWidth: 110, textAlign: 'right' }}>
              CHF {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: '#7a7a8e' }}>
            <span>TVA (%)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={tva}
              onChange={e => setTva(parseFloat(e.target.value) || 0)}
              style={{ ...inputStyle, width: 70, textAlign: 'right', fontFamily: 'DM Mono, monospace', padding: '4px 8px' }}
            />
            <span style={{ fontFamily: 'DM Mono, monospace', minWidth: 90, textAlign: 'right' }}>
              CHF {tvaAmount.toFixed(2)}
            </span>
          </div>
          <div
            className="flex items-center gap-10 text-base font-semibold pt-2 mt-1 border-t"
            style={{
              color: '#c9a84c',
              fontFamily: 'DM Mono, monospace',
              borderColor: 'rgba(255,255,255,0.07)',
            }}
          >
            <span>Total TTC</span>
            <span style={{ minWidth: 110, textAlign: 'right' }}>CHF {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Section Détails */}
      <div className="mb-8">
        <p style={sectionHeaderStyle}>Détails</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Valide jusqu&apos;au</label>
            <input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Statut initial</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="brouillon">brouillon</option>
              <option value="envoyé">envoyé</option>
              <option value="accepté">accepté</option>
              <option value="refusé">refusé</option>
            </select>
          </div>
          <div className="col-span-2">
            <label style={labelStyle}>Notes internes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes visibles sur le devis..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => submit('brouillon')}
          disabled={submitting || !clientName.trim()}
          className="text-xs tracking-[3px] uppercase font-semibold px-5 py-2.5 transition-colors duration-200"
          style={{
            background: submitting ? 'rgba(201,168,76,0.5)' : '#c9a84c',
            color: '#0a0a0f',
            opacity: !clientName.trim() ? 0.5 : 1,
            cursor: !clientName.trim() ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Enregistrement...' : 'Enregistrer brouillon'}
        </button>
        <button
          type="button"
          onClick={() => submit('envoyé')}
          disabled={submitting || !clientName.trim()}
          className="text-xs tracking-[3px] uppercase font-semibold px-5 py-2.5 border transition-colors duration-200"
          style={{
            borderColor: 'rgba(255,255,255,0.15)',
            color: '#e8e8f0',
            opacity: !clientName.trim() ? 0.5 : 1,
            cursor: !clientName.trim() ? 'default' : 'pointer',
          }}
        >
          Envoyer
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/devis')}
          disabled={submitting}
          className="text-xs tracking-[2px] uppercase px-4 py-2 border transition-colors duration-200"
          style={{ borderColor: 'rgba(255,255,255,0.07)', color: '#7a7a8e' }}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
