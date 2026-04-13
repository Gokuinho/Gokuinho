'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConvertButton({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleConvert() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/devis/${quoteId}/convert`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Erreur lors de la conversion')
        return
      }
      const data = await res.json()
      router.push(`/admin/factures/${data.invoiceId}`)
    } catch {
      alert('Erreur réseau lors de la conversion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleConvert}
      disabled={loading}
      className="text-[10px] uppercase tracking-widest transition-colors duration-200"
      style={{ color: loading ? '#7a7a8e' : '#4ade80', cursor: loading ? 'default' : 'pointer' }}
    >
      {loading ? '...' : 'Convertir →'}
    </button>
  )
}
