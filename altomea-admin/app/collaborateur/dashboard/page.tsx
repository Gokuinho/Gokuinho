import { prisma } from '@/lib/db'
import StatusBadge from '@/components/shared/StatusBadge'

function StatCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="border p-6" style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}>
      <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
        {label}
      </p>
      <p className="text-4xl font-light" style={{ color: '#e8e8f0' }}>{value}</p>
      {sublabel && <p className="text-[11px] mt-2" style={{ color: '#7a7a8e' }}>{sublabel}</p>}
    </div>
  )
}

export default async function CollabDashboard() {
  const [totalLeads, newLeads, contactedLeads, recentLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'nouveau' } }),
    prisma.lead.count({ where: { status: 'contacté' } }),
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Overview</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard label="Total demandes" value={totalLeads.toString()} sublabel="Tous statuts confondus" />
        <StatCard label="Nouvelles" value={newLeads.toString()} sublabel="En attente de traitement" />
        <StatCard label="Contactées" value={contactedLeads.toString()} sublabel="Déjà traitées" />
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-widest mb-4" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
          5 dernières demandes
        </h2>
        <div className="border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div
            className="grid gap-4 px-5 py-3 text-[10px] uppercase tracking-widest border-b"
            style={{ color: '#7a7a8e', borderColor: 'rgba(255,255,255,0.07)', gridTemplateColumns: '1fr 1fr 1fr 120px' }}
          >
            <span>Restaurant</span>
            <span>Contact</span>
            <span>Statut</span>
            <span>Date</span>
          </div>
          {recentLeads.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm" style={{ color: '#7a7a8e' }}>Aucune demande pour l&apos;instant.</p>
            </div>
          ) : (
            recentLeads.map(lead => (
              <div
                key={lead.id}
                className="grid gap-4 items-center px-5 py-3.5 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.04)', gridTemplateColumns: '1fr 1fr 1fr 120px' }}
              >
                <p className="text-sm font-medium" style={{ color: '#e8e8f0' }}>{lead.restaurant}</p>
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ color: '#e8e8f0' }}>{lead.name}</p>
                  <p className="text-[11px] truncate" style={{ color: '#7a7a8e' }}>{lead.email}</p>
                </div>
                <StatusBadge status={lead.status} type="lead" />
                <span className="text-xs" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
                  {new Date(lead.createdAt).toLocaleDateString('fr-CH')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
