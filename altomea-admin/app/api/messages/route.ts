import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { clientId, content, senderRole } = await req.json()
  if (!clientId || !content || !senderRole) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  const msg = await prisma.message.create({ data: { clientId, content, senderRole, read: senderRole === 'admin' } })
  return NextResponse.json(msg)
}
