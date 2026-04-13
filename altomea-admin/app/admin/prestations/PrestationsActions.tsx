'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PrestationsActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleActive() {
    setLoading(true)
    try {
      await fetch(`/api/prestations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Link
        href={`/admin/prestations/${id}`}
        className="text-xs uppercase tracking-widest transition-colors duration-200"
        style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }}
      >
        Modifier →
      </Link>
      <button
        onClick={toggleActive}
        disabled={loading}
        className="text-xs uppercase tracking-widest transition-colors duration-200 text-left"
        style={{
          color: '#7a7a8e',
          fontFamily: 'DM Mono, monospace',
          opacity: loading ? 0.5 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {active ? 'Désactiver' : 'Activer'}
      </button>
    </div>
  )
}
