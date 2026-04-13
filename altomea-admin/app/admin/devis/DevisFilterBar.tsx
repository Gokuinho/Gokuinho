'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const TABS = [
  { label: 'Tous', value: '' },
  { label: 'Brouillon', value: 'brouillon' },
  { label: 'Envoyé', value: 'envoyé' },
  { label: 'Accepté', value: 'accepté' },
  { label: 'Refusé', value: 'refusé' },
  { label: 'Converti', value: 'converti_en_facture' },
]

export default function DevisFilterBar({ currentStatus }: { currentStatus?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    router.push(`/admin/devis?${params.toString()}`)
  }

  const active = currentStatus ?? ''

  return (
    <div className="flex gap-1 mb-6 flex-wrap">
      {TABS.map(tab => {
        const isActive = tab.value === active
        return (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className="text-[10px] uppercase tracking-[2px] px-3 py-1.5 transition-colors duration-200"
            style={{
              fontFamily: 'DM Mono, monospace',
              background: isActive ? '#c9a84c' : 'rgba(255,255,255,0.03)',
              color: isActive ? '#0a0a0f' : '#7a7a8e',
              border: `1px solid ${isActive ? '#c9a84c' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
