import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function formatMs(ms: number | null) {
  if (ms === null) return '—'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export const dynamic = 'force-dynamic'

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: {
      entries: {
        include: {
          category: { include: { season: true } },
          timeRecords: { include: { checkpoint: true }, orderBy: { timestamp: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!athlete) notFound()

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/athletes" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-3xl font-bold text-gray-900">{athlete.firstName} {athlete.lastName}</h1>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-4">Historie závodů</h2>
        {athlete.entries.length === 0 ? <p className="text-gray-400 text-sm">Žádné starty</p> : (
          <div className="space-y-3">
            {athlete.entries.map((entry: any) => {
              const records = entry.timeRecords
              const start = records.find((r: any) => r.checkpoint.type === 'start')?.timestamp ?? entry.category.startTime
              const finish = records.find((r: any) => r.checkpoint.type === 'finish')?.timestamp
              const totalMs = start && finish ? new Date(finish).getTime() - new Date(start).getTime() : null
              return (
                <div key={entry.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.category.color }} />
                    <span className="font-medium text-sm">{entry.category.season.name}</span>
                    <span className="text-gray-500 text-xs">· #{entry.bibNumber}</span>
                  </div>
                  <p className="text-xs text-gray-600">{entry.category.name}</p>
                  {totalMs && <p className="text-sm font-bold text-emerald-700 mt-1">Celkový čas: {formatMs(totalMs)}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
