import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import ServiceForm from '../ServiceForm'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = await prisma.service.findUnique({ where: { id } })
  if (!service) notFound()
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Catalogue</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">{service.name}</h1>
      </div>
      <ServiceForm service={service} />
    </div>
  )
}
