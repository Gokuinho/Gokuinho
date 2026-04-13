import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendDevisEmail } from '@/lib/email'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  const quote = await prisma.quote.findUnique({ where: { id } })
  if (!quote) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json(quote)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  const data = await req.json()

  // Check current status before update to detect transition to 'envoyé'
  const current = await prisma.quote.findUnique({ where: { id }, select: { status: true } })

  const quote = await prisma.quote.update({ where: { id }, data })

  // Send email only when status transitions TO 'envoyé' (not already 'envoyé')
  if (data.status === 'envoyé' && current?.status !== 'envoyé' && quote.clientEmail) {
    sendDevisEmail({
      to: quote.clientEmail,
      clientName: quote.clientName,
      restaurantName: quote.restaurantName,
      city: quote.city,
      quoteNumber: quote.number,
      quoteId: quote.id,
      total: quote.total,
      validUntil: quote.validUntil,
    }).catch(err => console.error('[email] Failed to send devis email:', err))
  }

  return NextResponse.json(quote)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  await prisma.quote.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
