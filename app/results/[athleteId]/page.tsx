import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'

function formatMs(ms: number | null) {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export const dynamic = 'force-dynamic'

export default async function AthletePublicPage({ params }: { params: Promise<{ athleteId: string }> }) {
  const { athleteId } = await params
  if (athleteId === 'relay') return (
    <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-400">
      <p>Detail štafety zatím není k dispozici</p>
      <Link href="/results" className="text-emerald-600 mt-4 block">← Zpět na výsledky</Link>
    </div>
  )

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
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
  if (!athlete) return (
    <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-400">
      <p>Závodník nenalezen</p>
      <Link href="/results" className="text-emerald-600 mt-4 block">← Zpět na výsledky</Link>
    </div>
  )

  const entriesWithTimes = athlete.entries.map(e => {
    const records = e.timeRecords
    const start = records.find(r => r.checkpoint.type === 'start')?.timestamp ?? e.category.startTime
    const depot1 = records.find(r => r.checkpoint.type === 'depot1')?.timestamp
    const depot2 = records.find(r => r.checkpoint.type === 'depot2')?.timestamp
    const finish = records.find(r => r.checkpoint.type === 'finish')?.timestamp
    const swimMs = start && depot1 ? depot1.getTime() - new Date(start).getTime() : null
    const bikeMs = depot1 && depot2 ? depot2.getTime() - depot1.getTime() : null
    const runMs = depot2 && finish ? finish.getTime() - depot2.getTime() : null
    const totalMs = start && finish ? finish.getTime() - new Date(start).getTime() : null
    return { ...e, swimMs, bikeMs, runMs, totalMs }
  })

  const bestTotal = Math.min(...entriesWithTimes.filter(e => e.totalMs).map(e => e.totalMs!))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-900 text-white px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <Link href="/results" className="text-emerald-300 text-sm hover:text-white mb-2 block">← Výsledky</Link>
          <h1 className="text-2xl font-bold">{athlete.firstName} {athlete.lastName}</h1>
          {athlete.dateOfBirth && (
            <p className="text-emerald-300 text-sm">
              {Math.floor((Date.now() - athlete.dateOfBirth.getTime()) / 31557600000)} let
            </p>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {bestTotal < Infinity && (
          <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <Trophy className="text-orange-500" size={28} />
            <div>
              <p className="text-sm text-gray-500">Osobní rekord</p>
              <p className="text-2xl font-black font-mono text-gray-900">{formatMs(bestTotal)}</p>
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-gray-700 px-1">Historie závodů</h2>

        {entriesWithTimes.map(e => (
          <div key={e.id} className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.category.color }} />
              <span className="font-bold text-gray-900">{e.category.season.name}</span>
              <span className="text-gray-400 text-sm ml-auto">#{e.bibNumber}</span>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-gray-600 mb-3">{e.category.name}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: '🏊 Plavání', ms: e.swimMs },
                  { label: '🚴 Kolo', ms: e.bikeMs },
                  { label: '🏃 Běh', ms: e.runMs },
                  { label: '⏱ Celkem', ms: e.totalMs },
                ].map(({ label, ms }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="font-mono font-bold text-gray-900 text-sm">{formatMs(ms)}</p>
                  </div>
                ))}
              </div>
              {e.totalMs === bestTotal && bestTotal < Infinity && (
                <p className="text-xs text-orange-600 font-medium mt-2 text-center">🏆 Osobní rekord</p>
              )}
            </div>
          </div>
        ))}

        {entriesWithTimes.length === 0 && (
          <p className="text-center text-gray-400 py-8">Žádné závodní výsledky</p>
        )}
      </main>
    </div>
  )
}
