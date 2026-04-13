import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import ClientMessageThread from './ClientMessageThread'

export default async function ClientMessagesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const messages = await prisma.message.findMany({ where: { clientId: session.user.id }, orderBy: { createdAt: 'asc' } })

  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Messagerie</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Altomea</h1>
        <p style={{ color: '#7a7a8e' }} className="text-sm mt-1">Envoyez un message à notre équipe</p>
      </div>
      <ClientMessageThread clientId={session.user.id} initialMessages={messages} />
    </div>
  )
}
