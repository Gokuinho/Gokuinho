import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  const invoice = await prisma.invoice.findUnique({ where: { id } })
  if (!invoice) return NextResponse.json({ error: 'Non trouvée' }, { status: 404 })
  return NextResponse.json(invoice)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !['admin', 'comptable'].includes(session.user.role)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  const data = await req.json()
  const invoice = await prisma.invoice.update({ where: { id }, data })
  return NextResponse.json(invoice)
}
