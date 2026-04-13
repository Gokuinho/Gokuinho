import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function CollabMessagesPage() {
  const allMessages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    include: { client: { select: { id: true, name: true, email: true } } },
  })

  const seen = new Set<string>()
  const threads = allMessages.filter(m => {
    if (seen.has(m.clientId)) return false
    seen.add(m.clientId)
    return true
  })

  const threadsWithUnread = await Promise.all(
    threads.map(async (t) => {
      const unread = await prisma.message.count({
        where: { clientId: t.clientId, senderRole: 'client', read: false },
      })
      return { ...t, unread }
    })
  )

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Messagerie</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Messages clients</h1>
        <p style={{ color: '#7a7a8e' }} className="text-sm mt-1">{threadsWithUnread.length} conversation{threadsWithUnread.length !== 1 ? 's' : ''}</p>
      </div>

      {threadsWithUnread.length === 0 ? (
        <div className="border p-12 text-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <p style={{ color: '#7a7a8e' }} className="text-sm">Aucun message pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {threadsWithUnread.map(t => (
            <Link
              key={t.clientId}
              href={`/collaborateur/messages/${t.clientId}`}
              className="flex items-center justify-between px-5 py-4 group"
              style={{ background: '#0a0a0f', transition: 'background 0.2s' }}
            >
              <div className="min-w-0 flex-1">
                <p style={{ color: '#e8e8f0' }} className="text-sm font-medium">{t.client.name}</p>
                <p style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-xs mt-0.5">{t.client.email}</p>
                <p style={{ color: '#7a7a8e' }} className="text-xs mt-1.5 truncate max-w-md">{t.content}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {t.unread > 0 && (
                  <span
                    className="flex items-center justify-center rounded-full text-[9px] font-bold w-5 h-5"
                    style={{ background: '#c9a84c', color: '#0a0a0f' }}
                  >
                    {t.unread}
                  </span>
                )}
                <span style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }} className="text-xs">
                  {new Date(t.createdAt).toLocaleDateString('fr-CH')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
