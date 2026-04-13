import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import SidebarShell from '@/components/layout/SidebarShell'
import SessionProvider from '@/components/SessionProvider'

export default async function ComptableLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || !['admin', 'comptable'].includes(session.user.role)) redirect('/unauthorized')

  const navItems = [
    { href: '/comptable/dashboard', label: 'Dashboard', icon: '◈' },
    { href: '/comptable/factures', label: 'Factures', icon: '◇' },
  ]

  return (
    <SessionProvider>
      <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
        <SidebarShell role="Comptable" navItems={navItems} />
        <main className="flex-1 p-8 overflow-auto min-w-0">{children}</main>
      </div>
    </SessionProvider>
  )
}
