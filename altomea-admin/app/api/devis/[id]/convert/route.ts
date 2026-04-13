import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params

  const quote = await prisma.quote.findUnique({ where: { id } })
  if (!quote) return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
  if (quote.status !== 'accepté') return NextResponse.json({ error: 'Le devis doit être accepté pour être converti' }, { status: 400 })

  const lastInv = await prisma.invoice.findFirst({ orderBy: { createdAt: 'desc' } })
  const year = new Date().getFullYear()
  let seq = 1
  if (lastInv?.number) {
    const match = lastInv.number.match(/\d+$/)
    if (match) seq = parseInt(match[0]) + 1
  }
  const invNumber = `FAC-${year}-${String(seq).padStart(3, '0')}`

  const invoice = await prisma.invoice.create({
    data: {
      number: invNumber,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      items: quote.items,
      subtotal: quote.subtotal,
      tva: quote.tva,
      total: quote.total,
      status: 'brouillon',
      dueDate: '',
      clientUserId: quote.clientUserId ?? null,
    },
  })

  await prisma.quote.update({ where: { id }, data: { status: 'converti_en_facture' } })

  return NextResponse.json({ invoiceId: invoice.id })
}
