import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const dbUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
const url = dbUrl.startsWith('file:') ? dbUrl : `file:${dbUrl}`
const adapter = new PrismaBetterSqlite3({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding...')

  const adminHash = await bcrypt.hash('admin123', 10)
  const tkHash = await bcrypt.hash('timer123', 10)
  const annHash = await bcrypt.hash('announce123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminHash, name: 'Administrátor', role: 'admin' },
  })

  const timekeeper1 = await prisma.user.upsert({
    where: { username: 'timekeeper1' },
    update: {},
    create: { username: 'timekeeper1', password: tkHash, name: 'Jan Měřič', role: 'timekeeper' },
  })

  await prisma.user.upsert({
    where: { username: 'announcer1' },
    update: {},
    create: { username: 'announcer1', password: annHash, name: 'Marie Hlasatelka', role: 'announcer' },
  })

  const season = await prisma.season.upsert({
    where: { id: 'season-2024' },
    update: {},
    create: {
      id: 'season-2024',
      year: 2024,
      name: 'Hostín Triatlon 2024',
      date: new Date('2024-07-20'),
      location: 'Hostín u Vojkovic',
      status: 'live',
      checkpoints: {
        create: [
          { id: 'cp-start', type: 'start', order: 1, label: 'Start', optional: false },
          { id: 'cp-depot1', type: 'depot1', order: 2, label: 'Depo 1 (Plavání → Kolo)', optional: false },
          { id: 'cp-depot2', type: 'depot2', order: 3, label: 'Depo 2 (Kolo → Běh)', optional: false },
          { id: 'cp-finish', type: 'finish', order: 4, label: 'Cíl', optional: false },
        ],
      },
    },
  })

  const catMuzi = await prisma.category.upsert({
    where: { id: 'cat-muzi' },
    update: {},
    create: {
      id: 'cat-muzi',
      seasonId: season.id,
      name: 'Muži 18–39',
      color: '#3b82f6',
      type: 'individual',
      startOrder: 1,
      startTime: new Date('2024-07-20T09:00:00'),
    },
  })

  const catZeny = await prisma.category.upsert({
    where: { id: 'cat-zeny' },
    update: {},
    create: {
      id: 'cat-zeny',
      seasonId: season.id,
      name: 'Ženy',
      color: '#ec4899',
      type: 'individual',
      startOrder: 2,
      startTime: new Date('2024-07-20T09:05:00'),
    },
  })

  const catStafety = await prisma.category.upsert({
    where: { id: 'cat-stafety' },
    update: {},
    create: {
      id: 'cat-stafety',
      seasonId: season.id,
      name: 'Štafety',
      color: '#8b5cf6',
      type: 'relay',
      startOrder: 3,
      startTime: new Date('2024-07-20T09:10:00'),
    },
  })

  const athleteData = [
    { id: 'ath-1', firstName: 'Tomáš', lastName: 'Novák', bib: 1, catId: catMuzi.id },
    { id: 'ath-2', firstName: 'Petr', lastName: 'Svoboda', bib: 2, catId: catMuzi.id },
    { id: 'ath-3', firstName: 'Martin', lastName: 'Dvořák', bib: 3, catId: catMuzi.id },
    { id: 'ath-4', firstName: 'Jan', lastName: 'Procházka', bib: 4, catId: catMuzi.id },
    { id: 'ath-5', firstName: 'Jakub', lastName: 'Kučera', bib: 5, catId: catMuzi.id },
    { id: 'ath-6', firstName: 'Jana', lastName: 'Horáková', bib: 11, catId: catZeny.id },
    { id: 'ath-7', firstName: 'Marie', lastName: 'Marková', bib: 12, catId: catZeny.id },
    { id: 'ath-8', firstName: 'Eva', lastName: 'Křížková', bib: 13, catId: catZeny.id },
    { id: 'ath-9', firstName: 'Anna', lastName: 'Blažková', bib: 14, catId: catZeny.id },
    { id: 'ath-10', firstName: 'Lucie', lastName: 'Kovářová', bib: 15, catId: catZeny.id },
  ]

  for (const a of athleteData) {
    const athlete = await prisma.athlete.upsert({
      where: { id: a.id },
      update: {},
      create: { id: a.id, firstName: a.firstName, lastName: a.lastName },
    })
    await prisma.entry.upsert({
      where: { seasonId_bibNumber: { seasonId: season.id, bibNumber: a.bib } },
      update: {},
      create: {
        seasonId: season.id,
        categoryId: a.catId,
        athleteId: athlete.id,
        bibNumber: a.bib,
        type: 'individual',
        status: 'registered',
      },
    })
  }

  const tkTeam = await prisma.timekeeperTeam.upsert({
    where: { id: 'team-1' },
    update: {},
    create: { id: 'team-1', categoryId: catMuzi.id, name: 'Tým A' },
  })
  await prisma.timekeeperTeamMember.upsert({
    where: { id: 'tkm-1' },
    update: {},
    create: { id: 'tkm-1', timekeeperTeamId: tkTeam.id, userId: timekeeper1.id },
  })

  console.log('✅ Seed complete!')
  console.log('  admin / admin123')
  console.log('  timekeeper1 / timer123')
  console.log('  announcer1 / announce123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
