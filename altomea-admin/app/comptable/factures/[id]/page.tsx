import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'

export default async function FacturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await prisma.invoice.findUnique({ where: { id } })
  if (!invoice) notFound()

  let items: Array<{ description: string; qty?: number; amount?: number; unitPrice?: number }> = []
  try { items = JSON.parse(invoice.items) } catch { items = [] }

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Facturation</p>
          <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">
            {invoice.number}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/factures/${invoice.id}/print`}
            target="_blank"
            className="text-xs tracking-[2px] uppercase px-4 py-2 border transition-colors duration-200"
            style={{ borderColor: 'rgba(255,255,255,0.07)', color: '#e8e8f0' }}
          >
            Voir PDF ↗
          </Link>
          <Link
            href={`/comptable/factures/${invoice.id}/edit`}
            className="text-xs tracking-[3px] uppercase font-semibold px-5 py-2 transition-colors duration-200"
            style={{ background: '#c9a84c', color: '#0a0a0f' }}
          >
            Modifier
          </Link>
        </div>
      </div>

      <div className="border p-6 mb-6" style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Client</p>
            <p className="text-sm font-medium" style={{ color: '#e8e8f0' }}>{invoice.clientName}</p>
            {invoice.clientEmail && <p className="text-xs mt-0.5" style={{ color: '#7a7a8e' }}>{invoice.clientEmail}</p>}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Statut</p>
            <StatusBadge status={invoice.status} type="invoice" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Date de création</p>
            <p className="text-sm" style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }}>
              {new Date(invoice.createdAt).toLocaleDateString('fr-CH')}
            </p>
          </div>
          {invoice.dueDate && (
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Échéance</p>
              <p className="text-sm" style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }}>{invoice.dueDate}</p>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>Prestations</p>
            <div className="border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              {items.map((item, i) => {
                const qty = item.qty ?? 1
                const unitPrice = item.unitPrice ?? item.amount ?? 0
                const total = qty * unitPrice
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-b text-sm"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <span style={{ color: '#e8e8f0' }}>{item.description}</span>
                    <div className="flex items-center gap-6 text-right">
                      <span style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>×{qty}</span>
                      <span style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>CHF {unitPrice.toFixed(2)}</span>
                      <span style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }}>CHF {total.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-8 text-sm" style={{ color: '#7a7a8e' }}>
            <span>Sous-total HT</span>
            <span style={{ fontFamily: 'DM Mono, monospace' }}>CHF {invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-8 text-sm" style={{ color: '#7a7a8e' }}>
            <span>TVA ({invoice.tva}%)</span>
            <span style={{ fontFamily: 'DM Mono, monospace' }}>CHF {(invoice.subtotal * invoice.tva / 100).toFixed(2)}</span>
          </div>
          <div
            className="flex items-center gap-8 text-base font-semibold mt-2 pt-2 border-t"
            style={{ color: '#e8e8f0', borderColor: 'rgba(255,255,255,0.07)', fontFamily: 'DM Mono, monospace' }}
          >
            <span>Total TTC</span>
            <span style={{ color: '#c9a84c' }}>CHF {invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Link href="/comptable/factures" className="text-xs" style={{ color: '#7a7a8e' }}>
        ← Retour aux factures
      </Link>
    </div>
  )
}
