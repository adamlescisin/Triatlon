import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get('seasonId')
  const categoryId = searchParams.get('categoryId')

  const entries = await prisma.entry.findMany({
    where: {
      ...(seasonId ? { seasonId } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      athlete: true,
      category: true,
      relayTeam: { include: { slots: { include: { athlete: true } } } },
      timeRecords: { include: { checkpoint: true }, orderBy: { timestamp: 'asc' } },
    },
    orderBy: { bibNumber: 'asc' },
  })
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const entry = await prisma.entry.create({
    data: {
      seasonId: body.seasonId,
      categoryId: body.categoryId,
      athleteId: body.athleteId ?? null,
      bibNumber: body.bibNumber,
      type: body.type ?? 'individual',
      status: 'registered',
    },
    include: { athlete: true, category: true },
  })
  return NextResponse.json(entry, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { id, ...data } = body
  const entry = await prisma.entry.update({ where: { id }, data })
  return NextResponse.json(entry)
}
