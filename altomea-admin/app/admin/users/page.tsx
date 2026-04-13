import { prisma } from '@/lib/db'
import UserManager from './UserManager'

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Administration</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Utilisateurs</h1>
        <p style={{ color: '#7a7a8e' }} className="text-sm mt-1">{users.length} utilisateur{users.length !== 1 ? 's' : ''}</p>
      </div>
      <UserManager users={users} />
    </div>
  )
}
