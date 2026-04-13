import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import SidebarShell from '@/components/layout/SidebarShell'
import SessionProvider from '@/components/SessionProvider'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') redirect('/login')

  const [unreadMessages, newLeads] = await Promise.all([
    prisma.message.count({ where: { senderRole: 'client', read: false } }),
    prisma.lead.count({ where: { status: 'nouveau' } }),
  ])

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '◈' },
    { href: '/admin/leads', label: 'Demandes', icon: '◎', badge: newLeads },
    { href: '/admin/factures', label: 'Factures', icon: '◇' },
    { href: '/admin/prompts', label: 'Bibliothèque', icon: '◉' },
    { href: '/admin/workspace', label: 'Espace IA', icon: '▲' },
    { href: '/admin/messages', label: 'Messages', icon: '◻', badge: unreadMessages },
    { href: '/admin/users', label: 'Utilisateurs', icon: '◌' },
  ]

  return (
    <SessionProvider>
      <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
        <SidebarShell role="Admin" navItems={navItems} />
        <main className="flex-1 p-8 overflow-auto min-w-0">{children}</main>
      </div>
    </SessionProvider>
  )
}
