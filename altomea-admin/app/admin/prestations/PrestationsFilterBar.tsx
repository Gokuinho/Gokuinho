'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORY_TABS = [
  { label: 'Tous', value: '' },
  { label: 'Réseaux sociaux', value: 'reseaux_sociaux' },
  { label: 'Visibilité locale', value: 'visibilite_locale' },
  { label: 'Publicité', value: 'publicite' },
  { label: 'Contenu', value: 'contenu' },
  { label: 'Site web', value: 'site_web' },
  { label: 'Fidélisation', value: 'fidelisation' },
  { label: 'Autre', value: 'autre' },
]

export default function PrestationsFilterBar({
  currentCategory,
  currentActive,
}: {
  currentCategory?: string
  currentActive?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('category', value)
    } else {
      params.delete('category')
    }
    router.push(`/admin/prestations?${params.toString()}`)
  }

  function toggleActive(checked: boolean) {
    const params = new URLSearchParams(searchParams.toString())
    if (checked) {
      params.set('active', '1')
    } else {
      params.delete('active')
    }
    router.push(`/admin/prestations?${params.toString()}`)
  }

  const activeCategory = currentCategory ?? ''
  const isActiveOnly = currentActive === '1'

  return (
    <div className="flex items-center gap-4 mb-6 flex-wrap">
      <div className="flex gap-1 flex-wrap overflow-x-auto">
        {CATEGORY_TABS.map(tab => {
          const isActive = tab.value === activeCategory
          return (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className="text-[10px] uppercase tracking-[2px] px-3 py-1.5 transition-colors duration-200 whitespace-nowrap"
              style={{
                fontFamily: 'DM Mono, monospace',
                background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: isActive ? '#c9a84c' : '#7a7a8e',
                border: `1px solid ${isActive ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.07)'}`,
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#7a7a8e'
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <label
        className="flex items-center gap-2 cursor-pointer text-[10px] uppercase tracking-[2px] shrink-0"
        style={{ fontFamily: 'DM Mono, monospace', color: isActiveOnly ? '#c9a84c' : '#7a7a8e' }}
      >
        <input
          type="checkbox"
          checked={isActiveOnly}
          onChange={e => toggleActive(e.target.checked)}
          className="sr-only"
        />
        <span
          className="w-4 h-4 flex items-center justify-center border transition-colors duration-200"
          style={{
            background: isActiveOnly ? 'rgba(201,168,76,0.15)' : 'transparent',
            borderColor: isActiveOnly ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.07)',
          }}
        >
          {isActiveOnly && (
            <span style={{ color: '#c9a84c', fontSize: '10px', lineHeight: 1 }}>✓</span>
          )}
        </span>
        Actifs seulement
      </label>
    </div>
  )
}
