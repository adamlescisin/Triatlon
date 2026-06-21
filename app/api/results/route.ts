import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get('seasonId')

  const season = seasonId
    ? await prisma.season.findUnique({ where: { id: seasonId } })
    : await prisma.season.findFirst({ where: { status: { in: ['live', 'closed'] } }, orderBy: { year: 'desc' } })

  if (!season) return NextResponse.json({ season: null, categories: [] })

  const categories = await prisma.category.findMany({
    where: { seasonId: season.id },
    include: {
      entries: {
        include: {
          athlete: true,
          relayTeam: { include: { slots: { include: { athlete: true } } } },
          timeRecords: {
            include: { checkpoint: true },
            orderBy: { timestamp: 'asc' },
          },
        },
      },
    },
    orderBy: { startOrder: 'asc' },
  })

  const checkpoints = await prisma.checkpoint.findMany({
    where: { seasonId: season.id },
    orderBy: { order: 'asc' },
  })

  const categoriesWithResults = categories.map((cat) => {
    const entries = cat.entries.map((entry) => {
      const records = entry.timeRecords
      const startRecord = records.find((r) => r.checkpoint.type === 'start')
      const depot1Record = records.find((r) => r.checkpoint.type === 'depot1')
      const depot2Record = records.find((r) => r.checkpoint.type === 'depot2')
      const finishRecord = records.find((r) => r.checkpoint.type === 'finish')

      const startTime = startRecord?.timestamp ?? cat.startTime
      const swimTime = startTime && depot1Record
        ? depot1Record.timestamp.getTime() - new Date(startTime).getTime()
        : null
      const bikeTime = depot1Record && depot2Record
        ? depot2Record.timestamp.getTime() - depot1Record.timestamp.getTime()
        : null
      const runTime = depot2Record && finishRecord
        ? finishRecord.timestamp.getTime() - depot2Record.timestamp.getTime()
        : null
      const totalTime = startTime && finishRecord
        ? finishRecord.timestamp.getTime() - new Date(startTime).getTime()
        : null

      let currentStatus = entry.status
      if (entry.status === 'registered') {
        if (finishRecord) currentStatus = 'finished'
        else if (depot2Record) currentStatus = 'running'
        else if (depot1Record) currentStatus = 'biking'
        else if (startRecord) currentStatus = 'swimming'
        else currentStatus = 'waiting'
      }

      const lastCheckpoint = records.at(-1)

      return {
        ...entry,
        computed: {
          swimTime,
          bikeTime,
          runTime,
          totalTime,
          currentStatus,
          lastCheckpoint: lastCheckpoint ? {
            type: lastCheckpoint.checkpoint.type,
            label: lastCheckpoint.checkpoint.label,
            timestamp: lastCheckpoint.timestamp,
          } : null,
        },
      }
    })

    const sorted = [...entries].sort((a, b) => {
      const statusOrder: Record<string, number> = { finished: 0, running: 1, biking: 2, swimming: 3, waiting: 4, dnf: 5, dns: 6, dsq: 7 }
      const aOrder = statusOrder[a.computed.currentStatus] ?? 4
      const bOrder = statusOrder[b.computed.currentStatus] ?? 4
      if (aOrder !== bOrder) return aOrder - bOrder
      if (a.computed.totalTime && b.computed.totalTime) {
        return a.computed.totalTime - b.computed.totalTime
      }
      return a.bibNumber - b.bibNumber
    })

    const withRank = sorted.map((e, i) => ({
      ...e,
      computed: { ...e.computed, rank: e.computed.currentStatus === 'finished' ? i + 1 : null },
    }))

    return { ...cat, entries: withRank }
  })

  return NextResponse.json({ season, categories: categoriesWithResults, checkpoints })
}
