import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { clientId } = await req.json()
  await prisma.message.updateMany({ where: { clientId, senderRole: 'client', read: false }, data: { read: true } })
  return NextResponse.json({ success: true })
}
