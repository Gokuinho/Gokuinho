import Link from 'next/link'
import StatusBadge from './StatusBadge'

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

interface InvoiceTableProps {
  invoices: Invoice[]
  showClientColumn?: boolean
  basePath?: string
}

function formatCHF(amount: number) {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount)
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function InvoiceTable({
  invoices,
  showClientColumn = true,
  basePath = '/admin/factures',
}: InvoiceTableProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div
        className="grid gap-4 px-5 py-3 text-[10px] uppercase tracking-widest border-b"
        style={{
          color: '#7a7a8e',
          borderColor: 'rgba(255,255,255,0.07)',
          gridTemplateColumns: showClientColumn
            ? '120px 1fr 120px 110px 110px 80px'
            : '120px 120px 110px 110px 80px',
        }}
      >
        <span>Numéro</span>
        {showClientColumn && <span>Client</span>}
        <span>Montant HT</span>
        <span>Statut</span>
        <span>Échéance</span>
        <span></span>
      </div>

      {invoices.length === 0 ? (
        <div
          className="border-b p-10 text-center"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm" style={{ color: '#7a7a8e' }}>Aucune facture.</p>
        </div>
      ) : (
        invoices.map(inv => (
          <div
            key={inv.id}
            className="grid gap-4 items-center px-5 py-3.5 border-b transition-colors duration-200"
            style={{
              borderColor: 'rgba(255,255,255,0.04)',
              gridTemplateColumns: showClientColumn
                ? '120px 1fr 120px 110px 110px 80px'
                : '120px 120px 110px 110px 80px',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Numéro */}
            <span
              className="text-xs font-medium"
              style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }}
            >
              {inv.number}
            </span>

            {/* Client */}
            {showClientColumn && (
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: '#e8e8f0' }}>{inv.clientName}</p>
                <p className="text-[11px] truncate" style={{ color: '#7a7a8e' }}>{inv.clientEmail}</p>
              </div>
            )}

            {/* Montant HT */}
            <span
              className="text-sm"
              style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }}
            >
              {formatCHF(inv.subtotal)}
            </span>

            {/* Statut */}
            <StatusBadge status={inv.status} type="invoice" />

            {/* Échéance */}
            <span
              className="text-xs"
              style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}
            >
              {formatDate(inv.dueDate)}
            </span>

            {/* Actions */}
            <Link
              href={`${basePath}/${inv.id}`}
              className="text-xs uppercase tracking-widest transition-colors duration-200"
              style={{ color: '#c9a84c' }}
            >
              Voir →
            </Link>
          </div>
        ))
      )}
    </div>
  )
}
