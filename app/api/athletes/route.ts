import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const athletes = await prisma.athlete.findMany({
    where: q ? {
      OR: [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ],
    } : undefined,
    include: {
      entries: {
        include: { category: { include: { season: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { lastName: 'asc' },
  })
  return NextResponse.json(athletes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const athlete = await prisma.athlete.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      emergencyContact: body.emergencyContact,
    },
  })
  return NextResponse.json(athlete, { status: 201 })
}
