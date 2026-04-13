import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MessageThreadView from './MessageThreadView'

export default async function ThreadPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, email: true, clientStatus: true },
  })
  if (!client) notFound()

  const messages = await prisma.message.findMany({
    where: { clientId },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/messages"
          style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}
          className="text-xs tracking-wider uppercase hover:text-[#c9a84c] transition-colors duration-200"
        >
          ← Messages
        </Link>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold mt-3">
          {client.name}
        </h1>
        <p style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-xs mt-1">{client.email}</p>
      </div>
      <MessageThreadView clientId={clientId} clientName={client.name} initialMessages={messages} />
    </div>
  )
}
