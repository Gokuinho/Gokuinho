import { prisma } from '@/lib/db'
import Link from 'next/link'
import PrestationsFilterBar from './PrestationsFilterBar'
import PrestationsActions from './PrestationsActions'

const CATEGORY_LABELS: Record<string, string> = {
  reseaux_sociaux: 'Réseaux sociaux',
  visibilite_locale: 'Visibilité locale',
  publicite: 'Publicité',
  contenu: 'Contenu',
  site_web: 'Site web',
  fidelisation: 'Fidélisation',
  autre: 'Autre',
}

const UNIT_LABELS: Record<string, string> = {
  mois: '/mois',
  heure: '/heure',
  forfait: 'forfait',
  post: '/post',
  piece: '/pièce',
}

export default async function PrestationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; active?: string }>
}) {
  const sp = await searchParams ?? {}
  const category = sp.category
  const activeOnly = sp.active === '1'

  const where = {
    ...(category ? { category } : {}),
    ...(activeOnly ? { active: true } : {}),
  }

  const [services, allServices] = await Promise.all([
    prisma.service.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.service.findMany({ where: { active: true } }),
  ])

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p
            style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }}
            className="text-xs tracking-[4px] uppercase mb-2"
          >
            Catalogue
          </p>
          <h1
            style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}
            className="text-2xl font-semibold"
          >
            Prestations
          </h1>
          <p style={{ color: '#7a7a8e' }} className="text-sm mt-1">
            {allServices.length} prestation{allServices.length !== 1 ? 's' : ''} active{allServices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/prestations/nouvelle"
          className="text-xs tracking-[3px] uppercase font-semibold px-5 py-2.5 transition-colors duration-200 shrink-0"
          style={{ background: '#c9a84c', color: '#0a0a0f', fontFamily: 'DM Mono, monospace' }}
        >
          + Nouvelle prestation
        </Link>
      </div>

      {/* Filter bar */}
      <PrestationsFilterBar currentCategory={category} currentActive={sp.active} />

      {/* Table */}
      <div className="border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {/* Table header */}
        <div
          className="grid gap-4 px-5 py-3 text-[10px] uppercase tracking-widest border-b"
          style={{
            color: '#7a7a8e',
            borderColor: 'rgba(255,255,255,0.07)',
            gridTemplateColumns: '1fr 1fr 140px 100px 80px 80px 120px',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          <span>Nom</span>
          <span>Description</span>
          <span>Catégorie</span>
          <span>Prix</span>
          <span>Unité</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>

        {/* Rows */}
        {services.length === 0 ? (
          <div
            className="border-b p-10 text-center"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm" style={{ color: '#7a7a8e' }}>
              Aucune prestation{category ? ` dans cette catégorie` : ''}{activeOnly ? ' active' : ''}.
            </p>
          </div>
        ) : (
          services.map(service => (
            <div
              key={service.id}
              className="grid gap-4 items-center px-5 py-3.5 border-b"
              style={{
                borderColor: 'rgba(255,255,255,0.04)',
                gridTemplateColumns: '1fr 1fr 140px 100px 80px 80px 120px',
              }}
            >
              {/* Nom */}
              <span className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>
                {service.name}
              </span>

              {/* Description */}
              <span className="text-xs truncate" style={{ color: '#7a7a8e' }}>
                {service.description || '—'}
              </span>

              {/* Catégorie */}
              <span
                className="text-[10px] uppercase tracking-widest truncate"
                style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}
              >
                {CATEGORY_LABELS[service.category] ?? service.category}
              </span>

              {/* Prix */}
              <span
                className="text-sm font-medium"
                style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }}
              >
                CHF {service.unitPrice.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>

              {/* Unité */}
              <span
                className="text-[11px]"
                style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}
              >
                {UNIT_LABELS[service.unit] ?? service.unit}
              </span>

              {/* Statut */}
              <span
                className="text-[10px] uppercase tracking-widest px-2 py-0.5 inline-block"
                style={{
                  background: service.active ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                  color: service.active ? '#c9a84c' : '#7a7a8e',
                  border: `1px solid ${service.active ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  fontFamily: 'DM Mono, monospace',
                }}
              >
                {service.active ? 'Actif' : 'Inactif'}
              </span>

              {/* Actions */}
              <PrestationsActions id={service.id} active={service.active} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
