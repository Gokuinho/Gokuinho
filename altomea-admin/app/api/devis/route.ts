import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const quotes = await prisma.quote.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(quotes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const {
    clientName,
    restaurantName,
    city,
    clientEmail,
    status,
    items,
    subtotal,
    tva,
    total,
    validUntil,
    notes,
    clientUserId,
  } = await req.json()

  const lastQuote = await prisma.quote.findFirst({ orderBy: { createdAt: 'desc' } })
  const year = new Date().getFullYear()
  let seq = 1
  if (lastQuote?.number) {
    const match = lastQuote.number.match(/DEV-\d{4}-(\d+)/)
    if (match) seq = parseInt(match[1]) + 1
  }
  const number = `DEV-${year}-${String(seq).padStart(3, '0')}`

  const quote = await prisma.quote.create({
    data: {
      number,
      clientName,
      restaurantName: restaurantName ?? '',
      city: city ?? '',
      clientEmail: clientEmail ?? '',
      status: status ?? 'brouillon',
      items: items ?? '[]',
      subtotal: subtotal ?? 0,
      tva: tva ?? 7.7,
      total: total ?? 0,
      validUntil: validUntil ?? '',
      notes: notes ?? '',
      clientUserId: clientUserId ?? null,
    },
  })

  return NextResponse.json(quote)
}
