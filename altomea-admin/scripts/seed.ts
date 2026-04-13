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

async function main() {
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      // Mettre à jour le rôle si l'utilisateur existe déjà
      await prisma.user.update({ where: { email: u.email }, data: { role: u.role, clientStatus: u.clientStatus ?? 'nouveau', active: true } })
      console.log(`✓ Updated: ${u.email} (${u.role})`)
      continue
    }
    const hashed = await bcrypt.hash(u.password, 12)
    await prisma.user.create({
      data: {
        email: u.email,
        password: hashed,
        name: u.name,
        role: u.role,
        clientStatus: u.clientStatus ?? 'nouveau',
        active: true,
      },
    })
    console.log(`✓ Created: ${u.email} / ${u.password} (${u.role})`)
  }
  console.log('\n⚠  Change passwords after first login!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
