'use client'

import { useEffect, useState } from 'react'
import { Trophy, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function formatMs(ms: number | null): string {
  if (ms === null || ms === undefined) return '—'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: 'Čeká', color: 'bg-gray-100 text-gray-600' },
  swimming: { label: '🏊 Plave', color: 'bg-blue-100 text-blue-700' },
  biking: { label: '🚴 Na kole', color: 'bg-yellow-100 text-yellow-700' },
  running: { label: '🏃 Běží', color: 'bg-orange-100 text-orange-700' },
  finished: { label: '✓ V cíli', color: 'bg-emerald-100 text-emerald-700' },
  dnf: { label: 'DNF', color: 'bg-red-100 text-red-700' },
  dns: { label: 'DNS', color: 'bg-gray-100 text-gray-500' },
  dsq: { label: 'DSQ', color: 'bg-purple-100 text-purple-700' },
}

export default function ResultsPage() {
  const [data, setData] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    fetch('/api/results').then(r => r.json()).then(setData)
    fetch('/api/announcer-alerts?limit=5').then(r => r.json()).then(setAlerts)
  }

  useEffect(() => {
    fetchData()
    setLoading(false)
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !data) return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center text-white">
      <div className="text-center"><Clock size={48} className="mx-auto mb-4 animate-spin opacity-50" /><p>Načítání výsledků...</p></div>
    </div>
  )

  const { season, categories } = data
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-900 text-white px-4 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-emerald-300 text-sm hover:text-white mb-1 block">← Domů</Link>
            <h1 className="text-2xl font-bold">{season?.name ?? 'Výsledky'}</h1>
            {season?.status === 'live' && (<div className="flex items-center gap-2 mt-1"><span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" /><span className="text-orange-300 text-sm font-medium">ŽIVĚ · aktualizuje se automaticky</span></div>)}
          </div>
          <Trophy size={32} className="text-orange-400 opacity-80" />
        </div>
      </header>
      {alerts.length > 0 && (<div className="bg-orange-600 text-white px-4 py-2"><div className="max-w-4xl mx-auto"><p className="text-xs font-bold uppercase tracking-wide mb-1">📢 Hlasatel</p>{alerts.slice(0, 2).map((a: any) => (<p key={a.id} className="text-sm">{a.message}</p>))}</div></div>)}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {!season && (<div className="text-center py-16 text-gray-400"><AlertCircle size={48} className="mx-auto mb-3 opacity-30" /><p className="text-lg font-medium">Žádné výsledky k zobrazení</p></div>)}
        {categories?.map((cat: any) => (
          <div key={cat.id} className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderLeftColor: cat.color, borderLeftWidth: 4 }}>
              <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <h2 className="font-bold text-gray-900 text-lg">{cat.name}</h2>
              <span className="text-gray-400 text-sm ml-auto">{cat.type === 'relay' ? 'Štafety' : 'Jednotlivci'}</span>
            </div>
            <div className="divide-y">
              {cat.entries.map((entry: any, idx: number) => {
                const status = STATUS_LABELS[entry.computed?.currentStatus] ?? STATUS_LABELS.waiting
                const name = entry.athlete ? `${entry.athlete.firstName} ${entry.athlete.lastName}` : entry.relayTeam?.name ?? `Tým #${entry.bibNumber}`
                return (
                  <div key={entry.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xl font-black w-8 text-center text-gray-300">{entry.computed?.rank ?? (idx + 1)}</span>
                    <span className="font-bold text-lg w-10 text-center" style={{ color: cat.color }}>{entry.bibNumber}</span>
                    <div className="flex-1 min-w-0">
                      <Link href={`/results/${entry.athleteId ?? 'relay'}`} className="font-medium text-gray-900 hover:text-emerald-700 truncate block">{name}</Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {entry.computed?.totalTime ? <p className="font-mono font-bold text-gray-900 text-sm">{formatMs(entry.computed.totalTime)}</p> : <p className="text-gray-300 text-sm">—</p>}
                      {entry.computed?.swimTime && <p className="text-xs text-gray-400">🏊 {formatMs(entry.computed.swimTime)}</p>}
                    </div>
                  </div>
                )
              })}
              {cat.entries.length === 0 && <div className="px-4 py-6 text-center text-gray-400 text-sm">Žádní závodníci</div>}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
