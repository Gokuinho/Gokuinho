import { prisma } from '@/lib/db'
import LeadTable from '@/components/shared/LeadTable'

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">CRM</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Demandes</h1>
        <p style={{ color: '#7a7a8e' }} className="text-sm mt-1">{leads.length} demande{leads.length !== 1 ? 's' : ''} au total</p>
      </div>

      <LeadTable leads={leads} />
    </div>
  )
}
