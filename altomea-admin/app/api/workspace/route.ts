import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { model, system, message, apiKey, history } = await req.json()

  if (!apiKey) {
    return NextResponse.json({ error: 'Clé API manquante. Ouvrez les paramètres (⚙) pour la saisir.' })
  }

  try {
    if (model === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system,
          messages: [
            ...history.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: message },
          ],
        }),
      })
      const data = await res.json()
      return NextResponse.json({ response: data.content?.[0]?.text ?? 'Pas de réponse.' })
    }

    if (model === 'gpt') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            ...history,
            { role: 'user', content: message },
          ],
        }),
      })
      const data = await res.json()
      return NextResponse.json({ response: data.choices?.[0]?.message?.content ?? 'Pas de réponse.' })
    }

    return NextResponse.json({ error: 'Modèle inconnu.' })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la requête IA.' })
  }
}
