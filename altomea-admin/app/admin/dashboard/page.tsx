import { prisma } from '@/lib/db'
import StatusBadge from '@/components/shared/StatusBadge'

function StatCard({ label, value, sublabel, mono = false }: { label: string; value: string; sublabel?: string; mono?: boolean }) {
  return (
    <div className="border p-6" style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}>
      <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
        {label}
      </p>
      <p
        className="text-4xl font-light"
        style={{ color: '#e8e8f0', fontFamily: mono ? 'DM Mono, monospace' : undefined }}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-[11px] mt-2" style={{ color: '#7a7a8e' }}>{sublabel}</p>
      )}
    </div>
  )
}

export default async function DashboardPage() {
  const [
    totalLeads,
    newLeads,
    totalInvoices,
    paidInvoices,
    paidInvoicesData,
    unreadMessages,
    recentLeads,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'nouveau' } }),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: 'payé' } }),
    prisma.invoice.findMany({ where: { status: 'payé' }, select: { total: true } }),
    prisma.message.count({ where: { senderRole: 'client', read: false } }),
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const totalCA = paidInvoicesData.reduce((sum, inv) => sum + inv.total, 0)

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Overview</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total demandes" value={totalLeads.toString()} sublabel={`${newLeads} nouvelle${newLeads !== 1 ? 's' : ''}`} />
        <StatCard label="Nouvelles demandes" value={newLeads.toString()} sublabel="En attente de traitement" />
        <StatCard label="Total factures" value={totalInvoices.toString()} sublabel={`${paidInvoices} payée${paidInvoices !== 1 ? 's' : ''}`} />
        <StatCard label="Factures payées" value={paidInvoices.toString()} sublabel={`sur ${totalInvoices} au total`} />
        <StatCard
          label="CA encaissé"
          value={`CHF ${totalCA.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sublabel="Total factures payées"
          mono
        />
        <StatCard
          label="Messages non lus"
          value={unreadMessages.toString()}
          sublabel="Clients en attente de réponse"
        />
      </div>

      {/* Derniers leads */}
      <div>
        <h2 className="text-sm uppercase tracking-widest mb-4" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
          5 dernières demandes
        </h2>

        <div className="border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {/* Header */}
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
              <p className="text-sm" style={{ color: '#7a7a8e' }}>Aucune demande pour l'instant.</p>
            </div>
          ) : (
            recentLeads.map(lead => (
              <div
                key={lead.id}
                className="grid gap-4 items-center px-5 py-3.5 border-b transition-colors duration-200"
                style={{ borderColor: 'rgba(255,255,255,0.04)', gridTemplateColumns: '1fr 1fr 1fr 120px' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
