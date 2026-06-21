import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: { entries: { include: { category: { include: { season: true } }, timeRecords: { include: { checkpoint: true }, orderBy: { timestamp: 'asc' } } }, orderBy: { createdAt: 'desc' } } },
  })
  if (!athlete) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(athlete)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  if (body.dateOfBirth) body.dateOfBirth = new Date(body.dateOfBirth)
  const athlete = await prisma.athlete.update({ where: { id }, data: body })
  return NextResponse.json(athlete)
}
