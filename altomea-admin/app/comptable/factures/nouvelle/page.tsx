import InvoiceForm from '@/components/shared/InvoiceForm'

export default function NouvellePage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Facturation</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Nouvelle facture</h1>
      </div>
      <InvoiceForm basePath="/comptable/factures" />
    </div>
  )
}
