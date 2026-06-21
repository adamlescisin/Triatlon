import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      categories: { include: { entries: { include: { athlete: true, relayTeam: { include: { slots: { include: { athlete: true } } } } } }, timekeeperTeams: { include: { members: { include: { user: true } } } } } },
      checkpoints: { orderBy: { order: 'asc' } },
    },
  })
  if (!season) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(season)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const season = await prisma.season.update({ where: { id }, data: body })
  return NextResponse.json(season)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.season.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
