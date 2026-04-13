import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, email: true, name: true, role: true, active: true, clientStatus: true, createdAt: true } })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { email, password, name, role } = await req.json()
  if (!email || !password || !role) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 })
  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { email, password: hashed, name: name ?? email, role, active: true } })
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role })
}
