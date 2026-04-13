import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import InvoiceForm from '@/components/shared/InvoiceForm'

export default async function EditFacturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await prisma.invoice.findUnique({ where: { id } })
  if (!invoice) notFound()

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Facturation</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">
          Modifier {invoice.number}
        </h1>
      </div>
      <InvoiceForm invoice={invoice} basePath="/admin/factures" />
    </div>
  )
}
