import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.role !== undefined) data.role = body.role
  if (body.active !== undefined) data.active = body.active
  if (body.clientStatus !== undefined) data.clientStatus = body.clientStatus
  const user = await prisma.user.update({ where: { id }, data, select: { id: true, email: true, name: true, role: true, active: true, clientStatus: true } })
  return NextResponse.json(user)
}
