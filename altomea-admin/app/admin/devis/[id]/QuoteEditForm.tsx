'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuoteItem {
  description: string
  quantity: number
  unitPrice: number
}

interface QuoteData {
  id: string
  clientName: string
  restaurantName: string
  city: string
  clientEmail: string
  status: string
  items: string
  tva: number
  validUntil: string
  notes: string
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
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  display: 'block',
  marginBottom: 4,
}

export default function QuoteEditForm({ quote }: { quote: QuoteData }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [clientName, setClientName] = useState(quote.clientName)
  const [restaurantName, setRestaurantName] = useState(quote.restaurantName)
  const [city, setCity] = useState(quote.city)
  const [clientEmail, setClientEmail] = useState(quote.clientEmail)
  const [status, setStatus] = useState(quote.status)
  const [tva, setTva] = useState(quote.tva)
  const [validUntil, setValidUntil] = useState(quote.validUntil ?? '')
  const [notes, setNotes] = useState(quote.notes ?? '')

  let parsedItems: QuoteItem[] = []
  try { parsedItems = JSON.parse(quote.items) } catch { parsedItems = [] }
  if (!parsedItems.length) parsedItems = [{ description: '', quantity: 1, unitPrice: 0 }]

  const [items, setItems] = useState<QuoteItem[]>(parsedItems)

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
  const total = subtotal + subtotal * (tva / 100)

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/devis/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          restaurantName,
          city,
          clientEmail,
          status,
          tva,
          validUntil,
          notes,
          items: JSON.stringify(items),
          subtotal,
          total,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Erreur lors de la sauvegarde')
        return
      }
      router.refresh()
      setOpen(false)
    } catch {
      alert('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs tracking-[3px] uppercase font-semibold px-5 py-2 transition-colors duration-200"
        style={{ background: '#c9a84c', color: '#0a0a0f' }}
      >
        {open ? 'Fermer' : 'Modifier'}
      </button>

      {open && (
        <form onSubmit={handleSave} className="mt-6 border p-6" style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] uppercase tracking-widest mb-4 pb-3 border-b" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace', borderColor: 'rgba(255,255,255,0.07)' }}>
            Modifier le devis
          </p>

          {/* Status */}
          <div className="mb-4">
            <label style={labelStyle}>Statut</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ ...inputStyle }}
            >
              <option value="brouillon">brouillon</option>
              <option value="envoyé">envoyé</option>
              <option value="accepté">accepté</option>
              <option value="refusé">refusé</option>
              <option value="converti_en_facture">converti_en_facture</option>
            </select>
          </div>

          {/* Client info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Nom du client</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Restaurant</label>
              <input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Ville</label>
              <input value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Prestations</p>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    placeholder="Description"
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Qté"
                    value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                    style={{ ...inputStyle, width: 70 }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Prix unit."
                    value={item.unitPrice}
                    onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    style={{ ...inputStyle, width: 110 }}
                  />
                  <span style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace', fontSize: 13, width: 90, textAlign: 'right' }}>
                    {(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length <= 1}
                    style={{ color: '#f87171', fontSize: 16, padding: '0 6px', opacity: items.length <= 1 ? 0.3 : 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 text-[11px] tracking-widest uppercase px-3 py-1.5"
              style={{ color: '#7a7a8e', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
            >
              + Ajouter une ligne
            </button>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 mb-4 text-sm">
            <div className="flex gap-8" style={{ color: '#7a7a8e' }}>
              <span>Sous-total HT</span>
              <span style={{ fontFamily: 'DM Mono, monospace' }}>CHF {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-4 items-center" style={{ color: '#7a7a8e' }}>
              <span>TVA (%)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={tva}
                onChange={e => setTva(parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle, width: 70, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}
              />
              <span style={{ fontFamily: 'DM Mono, monospace' }}>CHF {(subtotal * tva / 100).toFixed(2)}</span>
            </div>
            <div className="flex gap-8 pt-2 border-t mt-1" style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace', fontWeight: 600, borderColor: 'rgba(255,255,255,0.07)' }}>
              <span>Total TTC</span>
              <span>CHF {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label style={labelStyle}>Valide jusqu&apos;au</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="text-xs tracking-[3px] uppercase font-semibold px-5 py-2.5 transition-colors duration-200"
              style={{ background: '#c9a84c', color: '#0a0a0f', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs tracking-[2px] uppercase px-4 py-2 border transition-colors duration-200"
              style={{ borderColor: 'rgba(255,255,255,0.07)', color: '#7a7a8e' }}
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
