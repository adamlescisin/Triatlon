import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const alerts = await prisma.announcerAlert.findMany({
    include: { entry: { include: { athlete: true, category: true } }, author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return NextResponse.json(alerts)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const alert = await prisma.announcerAlert.create({
    data: { entryId: body.entryId ?? null, checkpointType: body.checkpointType, message: body.message, authorId: session.user.id },
    include: { entry: { include: { athlete: true, category: true } }, author: { select: { name: true } } },
  })
  return NextResponse.json(alert, { status: 201 })
}
