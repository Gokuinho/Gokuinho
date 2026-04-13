import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import SidebarShell from '@/components/layout/SidebarShell'
import SessionProvider from '@/components/SessionProvider'

export default async function CollabLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || !['admin', 'collaborateur'].includes(session.user.role)) redirect('/unauthorized')

  const [unreadMessages, newLeads] = await Promise.all([
    prisma.message.count({ where: { senderRole: 'client', read: false } }),
    prisma.lead.count({ where: { status: 'nouveau' } }),
  ])

  const navItems = [
    { href: '/collaborateur/dashboard', label: 'Dashboard', icon: '◈' },
    { href: '/collaborateur/leads', label: 'Demandes', icon: '◎', badge: newLeads },
    { href: '/collaborateur/prompts', label: 'Bibliothèque', icon: '◉' },
    { href: '/collaborateur/workspace', label: 'Espace IA', icon: '▲' },
    { href: '/collaborateur/messages', label: 'Messages', icon: '◻', badge: unreadMessages },
  ]

  return (
    <SessionProvider>
      <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
        <SidebarShell role="Collaborateur" navItems={navItems} />
        <main className="flex-1 p-8 overflow-auto min-w-0">{children}</main>
      </div>
    </SessionProvider>
  )
}
