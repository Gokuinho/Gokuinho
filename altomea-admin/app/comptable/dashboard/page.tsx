import { prisma } from '@/lib/db'
import StatusBadge from '@/components/shared/StatusBadge'

function StatCard({ label, value, sublabel, mono = false }: { label: string; value: string; sublabel?: string; mono?: boolean }) {
  return (
    <div className="border p-6" style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}>
      <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
        {label}
      </p>
      <p className="text-4xl font-light" style={{ color: '#e8e8f0', fontFamily: mono ? 'DM Mono, monospace' : undefined }}>
        {value}
      </p>
      {sublabel && <p className="text-[11px] mt-2" style={{ color: '#7a7a8e' }}>{sublabel}</p>}
    </div>
  )
}

export default async function ComptableDashboard() {
  const [paidAgg, pendingAgg, overdueCount, totalCount, recentInvoices] = await Promise.all([
    prisma.invoice.aggregate({ where: { status: 'payé' }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { status: 'envoyé' }, _sum: { total: true } }),
    prisma.invoice.count({ where: { status: 'échu' } }),
    prisma.invoice.count(),
    prisma.invoice.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const caEncaisse = paidAgg._sum.total ?? 0
  const enAttente = pendingAgg._sum.total ?? 0

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Overview</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="CA encaissé"
          value={`CHF ${caEncaisse.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sublabel="Factures payées"
          mono
        />
        <StatCard
          label="En attente"
          value={`CHF ${enAttente.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sublabel="Factures envoyées"
          mono
        />
        <StatCard label="En retard" value={overdueCount.toString()} sublabel="Factures échues" />
        <StatCard label="Total factures" value={totalCount.toString()} sublabel="Tous statuts confondus" />
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-widest mb-4" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
          5 dernières factures
        </h2>
        <div className="border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div
            className="grid gap-4 px-5 py-3 text-[10px] uppercase tracking-widest border-b"
            style={{ color: '#7a7a8e', borderColor: 'rgba(255,255,255,0.07)', gridTemplateColumns: '1fr 1fr 120px 120px 100px' }}
          >
            <span>Numéro</span>
            <span>Client</span>
            <span>Montant</span>
            <span>Statut</span>
            <span>Date</span>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm" style={{ color: '#7a7a8e' }}>Aucune facture pour l&apos;instant.</p>
            </div>
          ) : (
            recentInvoices.map(inv => (
              <div
                key={inv.id}
                className="grid gap-4 items-center px-5 py-3.5 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.04)', gridTemplateColumns: '1fr 1fr 120px 120px 100px' }}
              >
                <p className="text-sm" style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }}>{inv.number}</p>
                <p className="text-sm truncate" style={{ color: '#e8e8f0' }}>{inv.clientName}</p>
                <p className="text-sm" style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }}>CHF {inv.total.toFixed(2)}</p>
                <StatusBadge status={inv.status} type="invoice" />
                <span className="text-xs" style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}>
                  {new Date(inv.createdAt).toLocaleDateString('fr-CH')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
