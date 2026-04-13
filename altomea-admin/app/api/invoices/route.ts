import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['admin', 'comptable'].includes(session.user.role)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { number, clientName, clientEmail, items, subtotal, tva, total, status, dueDate, clientUserId } = await req.json()
  const invoice = await prisma.invoice.create({
    data: { number, clientName, clientEmail: clientEmail ?? '', items, subtotal, tva, total, status: status ?? 'brouillon', dueDate: dueDate ?? '', clientUserId: clientUserId ?? null }
  })
  return NextResponse.json(invoice)
}
