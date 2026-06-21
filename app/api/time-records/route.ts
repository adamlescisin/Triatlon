import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const entryId = searchParams.get('entryId')
  const checkpointId = searchParams.get('checkpointId')
  const seasonId = searchParams.get('seasonId')
  const records = await prisma.timeRecord.findMany({
    where: { ...(entryId ? { entryId } : {}), ...(checkpointId ? { checkpointId } : {}), ...(seasonId ? { entry: { seasonId } } : {}) },
    include: { entry: { include: { athlete: true, category: true } }, checkpoint: true, timekeeper: { select: { id: true, name: true, username: true } } },
    orderBy: { timestamp: 'asc' },
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map(async (record: any) => {
      const existing = await prisma.timeRecord.findFirst({ where: { entryId: record.entryId, checkpointId: record.checkpointId, timestamp: new Date(record.timestamp), timekeeperId: session.user.id } })
      if (existing) return existing
      return prisma.timeRecord.create({ data: { entryId: record.entryId, checkpointId: record.checkpointId, timestamp: new Date(record.timestamp), timekeeperId: session.user.id, deviceId: record.deviceId, note: record.note } })
    }))
    return NextResponse.json(results, { status: 201 })
  }
  const existing = await prisma.timeRecord.findFirst({ where: { entryId: body.entryId, checkpointId: body.checkpointId, timestamp: new Date(body.timestamp), timekeeperId: session.user.id } })
  if (existing) return NextResponse.json(existing)
  const record = await prisma.timeRecord.create({
    data: { entryId: body.entryId, checkpointId: body.checkpointId, timestamp: new Date(body.timestamp), timekeeperId: session.user.id, deviceId: body.deviceId, note: body.note, isCorrection: body.isCorrection ?? false, corrects: body.corrects },
    include: { entry: { include: { athlete: true, category: true } }, checkpoint: true },
  })
  return NextResponse.json(record, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, note } = await req.json()
  const record = await prisma.timeRecord.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.timeRecord.create({ data: { entryId: record.entryId, checkpointId: record.checkpointId, timestamp: record.timestamp, timekeeperId: session.user.id, isCorrection: true, corrects: id, note: note ?? 'Zrušeno' } })
  await prisma.timeRecord.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
