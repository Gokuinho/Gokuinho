import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import StatusBadge from '@/components/shared/StatusBadge'

export default async function ClientFacturesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const invoices = await prisma.invoice.findMany({ where: { clientUserId: session.user.id }, orderBy: { createdAt: 'desc' } })

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Facturation</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Mes factures</h1>
      </div>
      {invoices.length === 0 ? (
        <div className="p-12 text-center border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <p style={{ color: '#7a7a8e' }} className="text-sm">Aucune facture pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-4" style={{ background: '#0a0a0f' }}>
              <div>
                <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-sm font-medium">{inv.number}</p>
                <p style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-xs mt-0.5">{new Date(inv.createdAt).toLocaleDateString('fr-CH')}</p>
              </div>
              <div className="flex items-center gap-4">
                <span style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }} className="text-sm">CHF {inv.total.toFixed(2)}</span>
                <StatusBadge status={inv.status} type="invoice" />
                <a href={`/factures/${inv.id}/print`} target="_blank" className="text-xs tracking-[2px] uppercase px-3 py-1.5 border transition-colors duration-200" style={{ borderColor: 'rgba(255,255,255,0.07)', color: '#7a7a8e' }}>PDF →</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
