import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { title, category, content, tags } = await req.json()

  const prompt = await prisma.prompt.create({
    data: { title, category, content, tags: tags ?? '' },
  })

  return NextResponse.json(prompt)
}
