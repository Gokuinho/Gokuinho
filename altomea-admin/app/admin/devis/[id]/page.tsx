import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'
import QuoteEditForm from './QuoteEditForm'
import ConvertButton from '../ConvertButton'

export default async function DevisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = await prisma.quote.findUnique({ where: { id } })
  if (!quote) notFound()

  let items: Array<{ description: string; quantity: number; unitPrice: number }> = []
  try { items = JSON.parse(quote.items) } catch { items = [] }

  const tvaAmount = quote.subtotal * (quote.tva / 100)

  return (
    <div className="max-w-3xl">
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
            {quote.number}
          </h1>
          <div className="mt-2">
            <StatusBadge status={quote.status} type="quote" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/devis/${quote.id}/print`}
            target="_blank"
            className="text-xs tracking-[2px] uppercase px-4 py-2 border transition-colors duration-200"
            style={{ borderColor: 'rgba(255,255,255,0.07)', color: '#e8e8f0' }}
          >
            Voir impression ↗
          </Link>
        </div>
      </div>

      {/* Info grid */}
      <div className="border p-6 mb-6" style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Client</p>
            <p className="text-sm font-medium" style={{ color: '#e8e8f0' }}>{quote.clientName}</p>
            {quote.clientEmail && (
              <p className="text-xs mt-0.5" style={{ color: '#7a7a8e' }}>{quote.clientEmail}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Restaurant</p>
            <p className="text-sm" style={{ color: '#e8e8f0' }}>{quote.restaurantName || '—'}</p>
            {quote.city && (
              <p className="text-xs mt-0.5" style={{ color: '#7a7a8e' }}>{quote.city}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Date de création</p>
            <p className="text-sm" style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }}>
              {new Date(quote.createdAt).toLocaleDateString('fr-CH')}
            </p>
          </div>
          {quote.validUntil && (
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Valide jusqu&apos;au</p>
              <p className="text-sm" style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }}>{quote.validUntil}</p>
            </div>
          )}
          {quote.notes && (
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Notes</p>
              <p className="text-sm" style={{ color: '#e8e8f0' }}>{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Prestations</p>
            <div className="border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              {/* Items header */}
              <div
                className="grid gap-4 px-4 py-2 text-[10px] uppercase tracking-widest border-b"
                style={{
                  color: '#7a7a8e',
                  borderColor: 'rgba(255,255,255,0.07)',
                  fontFamily: 'DM Mono, monospace',
                  gridTemplateColumns: '1fr 60px 110px 110px',
                }}
              >
                <span>Description</span>
                <span className="text-center">Qté</span>
                <span className="text-right">Prix unit.</span>
                <span className="text-right">Total</span>
              </div>
              {items.map((item, i) => {
                const lineTotal = item.quantity * item.unitPrice
                return (
                  <div
                    key={i}
                    className="grid gap-4 items-center px-4 py-3 border-b text-sm"
                    style={{
                      borderColor: 'rgba(255,255,255,0.04)',
                      gridTemplateColumns: '1fr 60px 110px 110px',
                    }}
                  >
                    <span style={{ color: '#e8e8f0' }}>{item.description}</span>
                    <span className="text-center" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>{item.quantity}</span>
                    <span className="text-right" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>CHF {item.unitPrice.toFixed(2)}</span>
                    <span className="text-right" style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }}>CHF {lineTotal.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-8 text-sm" style={{ color: '#7a7a8e' }}>
            <span>Sous-total HT</span>
            <span style={{ fontFamily: 'DM Mono, monospace' }}>CHF {quote.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-8 text-sm" style={{ color: '#7a7a8e' }}>
            <span>TVA ({quote.tva}%)</span>
            <span style={{ fontFamily: 'DM Mono, monospace' }}>CHF {tvaAmount.toFixed(2)}</span>
          </div>
          <div
            className="flex items-center gap-8 text-base font-semibold mt-2 pt-2 border-t"
            style={{ color: '#e8e8f0', borderColor: 'rgba(255,255,255,0.07)', fontFamily: 'DM Mono, monospace' }}
          >
            <span>Total TTC</span>
            <span style={{ color: '#c9a84c' }}>CHF {quote.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Convert button for accepted quotes */}
      {quote.status === 'accepté' && (
        <div
          className="border p-5 mb-6 flex items-center justify-between"
          style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.2)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: '#e8e8f0' }}>Ce devis est accepté</p>
            <p className="text-xs mt-0.5" style={{ color: '#7a7a8e' }}>Vous pouvez le convertir en facture</p>
          </div>
          <ConvertButton quoteId={quote.id} />
        </div>
      )}

      {/* Edit form */}
      <div className="mb-6">
        <QuoteEditForm
          quote={{
            id: quote.id,
            clientName: quote.clientName,
            restaurantName: quote.restaurantName,
            city: quote.city,
            clientEmail: quote.clientEmail,
            status: quote.status,
            items: quote.items,
            tva: quote.tva,
            validUntil: quote.validUntil ?? '',
            notes: quote.notes ?? '',
          }}
        />
      </div>

      <Link href="/admin/devis" className="text-xs" style={{ color: '#7a7a8e' }}>
        ← Retour aux devis
      </Link>
    </div>
  )
}
