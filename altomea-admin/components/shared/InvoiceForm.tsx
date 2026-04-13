'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface Invoice {
  id: string
  number: string
  clientName: string
  clientEmail: string
  subtotal: number
  tva: number
  total: number
  status: string
  dueDate: string
  createdAt: Date
}

interface InvoiceFormProps {
  invoice?: Invoice | null
  basePath: string
}

const INVOICE_STATUSES = ['brouillon', 'envoyé', 'payé', 'échu']

const inputClass =
  'w-full text-sm px-3 py-2 outline-none border transition-colors duration-200'
const inputStyle = {
  background: 'rgba(255,255,255,0.03)',
  borderColor: 'rgba(255,255,255,0.07)',
  color: '#e8e8f0',
}
const labelClass = 'text-xs uppercase tracking-widest block mb-2'
const labelStyle = { color: '#7a7a8e' }

export default function InvoiceForm({ invoice, basePath }: InvoiceFormProps) {
  const router = useRouter()
  const [number, setNumber] = useState(invoice?.number ?? '')
  const [clientName, setClientName] = useState(invoice?.clientName ?? '')
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail ?? '')
  const [items, setItems] = useState(
    invoice ? JSON.stringify([{ description: 'Prestation', amount: invoice.subtotal }], null, 2) : ''
  )
  const [subtotal, setSubtotal] = useState(invoice?.subtotal?.toString() ?? '0')
  const [tva, setTva] = useState(invoice?.tva?.toString() ?? '8.1')
  const [total, setTotal] = useState(invoice?.total?.toString() ?? '0')
  const [status, setStatus] = useState(invoice?.status ?? 'brouillon')
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate ? invoice.dueDate.slice(0, 10) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Auto-calculate total when subtotal or tva changes
  useEffect(() => {
    const sub = parseFloat(subtotal) || 0
    const rate = parseFloat(tva) || 0
    setTotal((sub + (sub * rate) / 100).toFixed(2))
  }, [subtotal, tva])

  async function save() {
    setError('')
    if (!clientName || !clientEmail) {
      setError('Le nom et l\'email client sont requis.')
      return
    }
    setSaving(true)

    const payload = {
      number: number || undefined,
      clientName,
      clientEmail,
      items,
      subtotal: parseFloat(subtotal) || 0,
      tva: parseFloat(tva) || 0,
      total: parseFloat(total) || 0,
      status,
      dueDate: dueDate || undefined,
    }

    const url = invoice ? `/api/invoices/${invoice.id}` : '/api/invoices'
    const method = invoice ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error ?? 'Une erreur est survenue.')
      return
    }

    router.push(basePath)
  }

  return (
    <div
      className="border p-6 max-w-2xl"
      style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {error && (
        <p className="text-xs mb-4 px-3 py-2 border" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass} style={labelStyle}>Numéro de facture</label>
          <input
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="Auto-généré si vide"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Statut</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className={inputClass}
            style={inputStyle}
          >
            {INVOICE_STATUSES.map(s => (
              <option key={s} value={s} style={{ background: '#111118' }}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass} style={labelStyle}>Nom du client</label>
          <input
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Email du client</label>
          <input
            type="email"
            value={clientEmail}
            onChange={e => setClientEmail(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass} style={labelStyle}>Prestations (JSON)</label>
        <textarea
          value={items}
          onChange={e => setItems(e.target.value)}
          rows={4}
          placeholder={'[{"description": "Gestion réseaux sociaux", "amount": 1200}]'}
          className={`${inputClass} resize-none`}
          style={{ ...inputStyle, fontFamily: 'DM Mono, monospace', fontSize: '12px' }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelClass} style={labelStyle}>Montant HT (CHF)</label>
          <input
            type="number"
            value={subtotal}
            onChange={e => setSubtotal(e.target.value)}
            min="0"
            step="0.01"
            className={inputClass}
            style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>TVA (%)</label>
          <input
            type="number"
            value={tva}
            onChange={e => setTva(e.target.value)}
            min="0"
            step="0.1"
            className={inputClass}
            style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Total TTC (CHF)</label>
          <input
            type="number"
            value={total}
            readOnly
            className={inputClass}
            style={{
              ...inputStyle,
              fontFamily: 'DM Mono, monospace',
              color: '#c9a84c',
              cursor: 'default',
            }}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className={labelClass} style={labelStyle}>Date d'échéance</label>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className={inputClass}
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="text-xs tracking-[3px] uppercase font-semibold px-5 py-2 transition-colors duration-200 cursor-pointer disabled:opacity-40"
          style={{ background: '#c9a84c', color: '#0a0a0f' }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          onClick={() => router.push(basePath)}
          className="text-xs transition-colors duration-200 cursor-pointer"
          style={{ color: '#7a7a8e' }}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
