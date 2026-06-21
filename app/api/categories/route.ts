import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const category = await prisma.category.create({
    data: { seasonId: body.seasonId, name: body.name, color: body.color, type: body.type, startOrder: body.startOrder ?? 0, startTime: body.startTime ? new Date(body.startTime) : null },
  })
  return NextResponse.json(category, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, ...data } = body
  if (data.startTime) data.startTime = new Date(data.startTime)
  const category = await prisma.category.update({ where: { id }, data })
  return NextResponse.json(category)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
