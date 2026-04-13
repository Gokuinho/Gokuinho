import { prisma } from '@/lib/db'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'
import DevisFilterBar from './DevisFilterBar'
import ConvertButton from './ConvertButton'

function formatCHF(amount: number) {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount)
}

function formatDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ALL_STATUSES = ['brouillon', 'envoyé', 'accepté', 'refusé', 'converti_en_facture'] as const

export default async function DevisPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>
}) {
  const { status } = (await searchParams) ?? {}

  const where = status && ALL_STATUSES.includes(status as (typeof ALL_STATUSES)[number])
    ? { status }
    : {}

  const [quotes, allQuotes] = await Promise.all([
    prisma.quote.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.quote.findMany({ orderBy: { createdAt: 'desc' } }),
  ])

  const totalAccepted = allQuotes
    .filter(q => q.status === 'accepté')
    .reduce((sum, q) => sum + q.total, 0)

  const pendingCount = allQuotes.filter(q => q.status === 'envoyé').length

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p
            style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }}
            className="text-xs tracking-[4px] uppercase mb-2"
          >
            Commercial
          </p>
          <h1
            style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}
            className="text-2xl font-semibold"
          >
            Devis
          </h1>
          <p style={{ color: '#7a7a8e' }} className="text-sm mt-1 flex items-center gap-2">
            {allQuotes.length} devis au total —{' '}
            <span style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }}>
              CHF {totalAccepted.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} acceptés
            </span>
            {pendingCount > 0 && (
              <span
                className="text-[10px] px-2 py-0.5 ml-1"
                style={{
                  background: 'rgba(234,179,8,0.12)',
                  color: '#facc15',
                  border: '1px solid rgba(234,179,8,0.3)',
                  fontFamily: 'DM Mono, monospace',
                }}
              >
                {pendingCount} en attente
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/devis/nouveau"
          className="text-xs tracking-[3px] uppercase font-semibold px-5 py-2.5 transition-colors duration-200 shrink-0"
          style={{ background: '#c9a84c', color: '#0a0a0f' }}
        >
          + Nouveau devis
        </Link>
      </div>

      {/* Filter tabs */}
      <DevisFilterBar currentStatus={status} />

      {/* Table */}
      <div className="border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {/* Table header */}
        <div
          className="grid gap-4 px-5 py-3 text-[10px] uppercase tracking-widest border-b"
          style={{
            color: '#7a7a8e',
            borderColor: 'rgba(255,255,255,0.07)',
            gridTemplateColumns: '140px 1fr 120px 140px 110px 80px',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          <span>Numéro</span>
          <span>Client + Restaurant</span>
          <span>Montant TTC</span>
          <span>Statut</span>
          <span>Validité</span>
          <span></span>
        </div>

        {/* Rows */}
        {quotes.length === 0 ? (
          <div
            className="border-b p-10 text-center"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm" style={{ color: '#7a7a8e' }}>
              Aucun devis{status ? ` avec le statut "${status}"` : ''}.
            </p>
          </div>
        ) : (
          quotes.map(quote => (
            <div
              key={quote.id}
              className="grid gap-4 items-center px-5 py-3.5 border-b transition-colors duration-200"
              style={{
                borderColor: 'rgba(255,255,255,0.04)',
                gridTemplateColumns: '140px 1fr 120px 140px 110px 80px',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Numéro */}
              <span
                className="text-xs font-medium"
                style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }}
              >
                {quote.number}
              </span>

              {/* Client + Restaurant */}
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: '#e8e8f0' }}>{quote.clientName}</p>
                <p className="text-[11px] truncate" style={{ color: '#7a7a8e' }}>
                  {quote.restaurantName}{quote.city ? ` · ${quote.city}` : ''}
                </p>
              </div>

              {/* Montant TTC */}
              <span className="text-sm" style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }}>
                {formatCHF(quote.total)}
              </span>

              {/* Statut */}
              <StatusBadge status={quote.status} type="quote" />

              {/* Validité */}
              <span className="text-xs" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
                {formatDate(quote.validUntil)}
              </span>

              {/* Actions */}
              <div className="flex flex-col gap-1">
                <Link
                  href={`/admin/devis/${quote.id}`}
                  className="text-xs uppercase tracking-widest transition-colors duration-200"
                  style={{ color: '#c9a84c' }}
                >
                  Voir →
                </Link>
                {quote.status === 'accepté' && (
                  <ConvertButton quoteId={quote.id} />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
