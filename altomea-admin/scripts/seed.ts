import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const adapter = new PrismaLibSql({ url: 'file:dev.db' })
const prisma = new PrismaClient({ adapter })

const users = [
  { email: 'admin@altomea.ch',             password: 'altomea2025', name: 'Admin',           role: 'admin' },
  { email: 'collab@altomea.ch',            password: 'collab123',   name: 'Collaborateur',   role: 'collaborateur' },
  { email: 'compta@altomea.ch',            password: 'compta123',   name: 'Comptable',        role: 'comptable' },
  { email: 'client@restaurant-test.ch',    password: 'client123',   name: 'Restaurant Test', role: 'client', clientStatus: 'en_cours' },
]

const services = [
  { name: 'Gestion réseaux sociaux',           description: 'Gestion complète des comptes Instagram, Facebook et TikTok',    category: 'reseaux_sociaux',   unitPrice: 490,  unit: 'mois' },
  { name: 'Création contenu vidéo (Reels/TikTok)', description: 'Tournage et montage de vidéos courtes adaptées aux restaurants', category: 'contenu',           unitPrice: 200,  unit: 'mois' },
  { name: 'Shooting photo food',               description: 'Séance photo professionnelle de vos plats et de votre établissement', category: 'contenu',           unitPrice: 350,  unit: 'forfait' },
  { name: 'Google Ads local',                  description: 'Campagnes Google Ads ciblées géographiquement',                   category: 'publicite',         unitPrice: 300,  unit: 'mois' },
  { name: 'Meta Ads géolocalisées',            description: 'Publicités Facebook/Instagram sur votre zone de chalandise',      category: 'publicite',         unitPrice: 300,  unit: 'mois' },
  { name: 'Optimisation fiche Google Business', description: 'Optimisation complète de votre fiche Google My Business',         category: 'visibilite_locale', unitPrice: 150,  unit: 'forfait' },
  { name: 'Gestion et réponse aux avis',       description: 'Suivi et réponse professionnelle aux avis Google et TripAdvisor',  category: 'visibilite_locale', unitPrice: 100,  unit: 'mois' },
  { name: 'Création site web restaurant',      description: 'Création d\'un site vitrine moderne et responsive',               category: 'site_web',          unitPrice: 1200, unit: 'forfait' },
  { name: 'Menu digital QR Code',              description: 'Carte digitale accessible via QR code, mise à jour en temps réel', category: 'site_web',          unitPrice: 200,  unit: 'forfait' },
  { name: 'Système fidélisation digital',      description: 'Programme de fidélité digital avec carte dématérialisée',          category: 'fidelisation',      unitPrice: 150,  unit: 'mois' },
]

async function main() {
  // ── Users ──────────────────────────────────────────────────────────────────
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      await prisma.user.update({ where: { email: u.email }, data: { role: u.role, clientStatus: u.clientStatus ?? 'nouveau', active: true } })
      console.log(`✓ Updated: ${u.email} (${u.role})`)
      continue
    }
    const hashed = await bcrypt.hash(u.password, 12)
    await prisma.user.create({
      data: { email: u.email, password: hashed, name: u.name, role: u.role, clientStatus: u.clientStatus ?? 'nouveau', active: true },
    })
    console.log(`✓ Created: ${u.email} / ${u.password} (${u.role})`)
  }

  // ── Services ───────────────────────────────────────────────────────────────
  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } })
    if (existing) {
      console.log(`  → Service already exists: ${s.name}`)
      continue
    }
    await prisma.service.create({ data: { ...s, active: true } })
    console.log(`✓ Service: ${s.name} (${s.unitPrice} CHF/${s.unit})`)
  }

  console.log('\n⚠  Change passwords after first login!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
