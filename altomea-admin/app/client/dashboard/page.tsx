import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

const STATUS_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  nouveau:  { label: 'Nouveau',  color: '#3b82f6', desc: 'Votre dossier a été reçu.' },
  en_cours: { label: 'En cours', color: '#c9a84c', desc: 'Nous travaillons sur votre projet.' },
  actif:    { label: 'Actif',    color: '#22c55e', desc: 'Votre projet est en production.' },
  pause:    { label: 'Pause',    color: '#7a7a8e', desc: 'Votre projet est momentanément en pause.' },
}

export default async function ClientDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, clientStatus: true } })
  if (!user) redirect('/login')

  const invoices = await prisma.invoice.findMany({ where: { clientUserId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 3 })
  const status = STATUS_CONFIG[user.clientStatus] ?? STATUS_CONFIG.nouveau

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Mon espace</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Bonjour, {user.name}</h1>
      </div>

      <div className="p-6 mb-6 border" style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}>
        <p style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-[10px] uppercase tracking-widest mb-3">Statut de votre dossier</p>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: status.color }} />
          <span style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-lg font-semibold">{status.label}</span>
        </div>
        <p style={{ color: '#7a7a8e' }} className="text-sm mt-2">{status.desc}</p>
      </div>

      {invoices.length > 0 && (
        <div>
          <p style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-[10px] uppercase tracking-widest mb-3">Dernières factures</p>
          <div className="flex flex-col gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3" style={{ background: '#0a0a0f' }}>
                <span style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-sm">{inv.number}</span>
                <span style={{ color: '#e8e8f0', fontFamily: 'DM Mono, monospace' }} className="text-sm">CHF {inv.total.toFixed(2)}</span>
                <a href={`/factures/${inv.id}/print`} target="_blank" style={{ color: '#7a7a8e' }} className="text-xs hover:text-[#c9a84c] transition-colors duration-200">PDF →</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
