import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const seasons = await prisma.season.findMany({
    include: { categories: true, checkpoints: { orderBy: { order: 'asc' } } },
    orderBy: { year: 'desc' },
  })
  return NextResponse.json(seasons)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const season = await prisma.season.create({
    data: {
      year: body.year,
      name: body.name,
      date: new Date(body.date),
      location: body.location,
      checkpoints: {
        create: [
          { type: 'start', order: 1, label: 'Start', optional: false },
          { type: 'depot1', order: 2, label: 'Depo 1 (plavání → kolo)', optional: false },
          { type: 'depot2', order: 3, label: 'Depo 2 (kolo → běh)', optional: false },
          { type: 'finish', order: 4, label: 'Cíl', optional: false },
        ],
      },
    },
    include: { checkpoints: true },
  })
  return NextResponse.json(season, { status: 201 })
}
