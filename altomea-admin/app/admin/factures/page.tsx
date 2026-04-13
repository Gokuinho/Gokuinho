import { prisma } from '@/lib/db'
import InvoiceTable from '@/components/shared/InvoiceTable'
import Link from 'next/link'

export default async function FacturesPage() {
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } })

  const totalEncaisse = invoices
    .filter(inv => inv.status === 'payé')
    .reduce((sum, inv) => sum + inv.total, 0)

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Facturation</p>
          <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Factures</h1>
          <p style={{ color: '#7a7a8e' }} className="text-sm mt-1">
            {invoices.length} facture{invoices.length !== 1 ? 's' : ''} — CA encaissé :{' '}
            <span style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }}>
              CHF {totalEncaisse.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <Link
          href="/admin/factures/nouvelle"
          className="text-xs tracking-[3px] uppercase font-semibold px-5 py-2.5 transition-colors duration-200 shrink-0"
          style={{ background: '#c9a84c', color: '#0a0a0f' }}
        >
          + Nouvelle facture
        </Link>
      </div>

      <div className="border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <InvoiceTable invoices={invoices} basePath="/admin/factures" />
      </div>
    </div>
  )
}
