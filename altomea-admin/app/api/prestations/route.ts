import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const activeParam = searchParams.get('active')

  const where = activeParam === 'true' ? { active: true } : {}

  const services = await prisma.service.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { name, description, category, unitPrice, unit, active } = await req.json()

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
  }

  const service = await prisma.service.create({
    data: {
      name: name.trim(),
      description: description ?? '',
      category: category ?? 'autre',
      unitPrice: unitPrice ?? 0,
      unit: unit ?? 'forfait',
      active: active ?? true,
    },
  })

  return NextResponse.json(service)
}
