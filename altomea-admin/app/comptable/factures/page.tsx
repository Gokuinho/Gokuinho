import { prisma } from '@/lib/db'
import InvoiceTable from '@/components/shared/InvoiceTable'
import Link from 'next/link'

export default async function FacturesPage() {
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } })
  const totalPaid = invoices.filter(i => i.status === 'payé').reduce((sum, i) => sum + i.total, 0)

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Facturation</p>
          <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Factures</h1>
          <p style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-sm mt-1">
            {invoices.length} facture{invoices.length !== 1 ? 's' : ''} · CHF {totalPaid.toFixed(2)} encaissé
          </p>
        </div>
        <Link href="/comptable/factures/nouvelle" className="text-xs tracking-[2px] uppercase font-semibold px-5 py-3 transition-colors duration-200" style={{ background: '#c9a84c', color: '#0a0a0f' }}>
          + Nouvelle facture
        </Link>
      </div>
      <InvoiceTable invoices={invoices} basePath="/comptable/factures" />
    </div>
  )
}
