import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import SidebarShell from '@/components/layout/SidebarShell'
import SessionProvider from '@/components/SessionProvider'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || !['client', 'admin'].includes(session.user.role)) redirect('/unauthorized')

  const navItems = [
    { href: '/client/dashboard', label: 'Mon dossier', icon: '◈' },
    { href: '/client/factures', label: 'Mes factures', icon: '◇' },
    { href: '/client/messages', label: 'Messagerie', icon: '◻' },
  ]

  return (
    <SessionProvider>
      <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
        <SidebarShell role="Espace client" navItems={navItems} />
        <main className="flex-1 p-8 overflow-auto min-w-0">{children}</main>
      </div>
    </SessionProvider>
  )
}
