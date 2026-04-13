import { prisma } from '@/lib/db'
import PromptsClient from '@/components/shared/PromptsClient'

export default async function PromptsPage() {
  const prompts = await prisma.prompt.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Prompts</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Bibliothèque de prompts</h1>
        <p style={{ color: '#7a7a8e' }} className="text-sm mt-1">Vos prompts réutilisables pour Claude, ChatGPT ou Gemini</p>
      </div>
      <PromptsClient prompts={prompts} />
    </div>
  )
}
