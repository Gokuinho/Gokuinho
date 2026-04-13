import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function UnauthorizedPage() {
  const session = await getServerSession(authOptions)

  const dest = !session ? '/login' :
    session.user.role === 'admin' ? '/admin/dashboard' :
    session.user.role === 'collaborateur' ? '/collaborateur/dashboard' :
    session.user.role === 'comptable' ? '/comptable/dashboard' :
    '/client/dashboard'

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="text-center max-w-sm">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[5px] uppercase mb-6">Altomea</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold mb-3">Accès refusé</h1>
        <p style={{ color: '#7a7a8e' }} className="text-sm mb-8">Vous n'avez pas accès à cette page.</p>
        <Link
          href={dest}
          className="inline-block text-xs tracking-[3px] uppercase font-semibold px-6 py-3 transition-colors duration-200"
          style={{ background: '#c9a84c', color: '#0a0a0f' }}
        >
          Retour à mon espace
        </Link>
      </div>
    </div>
  )
}
