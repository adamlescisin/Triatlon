'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Wifi, WifiOff, RotateCcw, Check } from 'lucide-react'
import Link from 'next/link'

interface PendingRecord {
  id: string
  entryId: string
  checkpointId: string
  timestamp: string
  synced: boolean
}

export default function TimingCheckpointPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const checkpointId = searchParams.get('checkpointId')
  const seasonId = searchParams.get('seasonId')
  const [entries, setEntries] = useState<any[]>([])
  const [recorded, setRecorded] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<PendingRecord[]>([])
  const [online, setOnline] = useState(true)
  const [lastAction, setLastAction] = useState<{ entryId: string; time: string; name: string } | null>(null)
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null)
  const pressProgress = useRef<Record<string, number>>({})
  const [pressing, setPressing] = useState<Record<string, number>>({})
  const progressInterval = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    setOnline(navigator.onLine)
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    if (!seasonId || !checkpointId) return
    fetch(`/api/entries?seasonId=${seasonId}`).then(r => r.json()).then((data: any[]) => {
      setEntries(data)
      const alreadyRecorded = new Set<string>()
      data.forEach(e => { if (e.timeRecords?.some((r: any) => r.checkpointId === checkpointId)) alreadyRecorded.add(e.id) })
      setRecorded(alreadyRecorded)
    })
  }, [seasonId, checkpointId])

  useEffect(() => { const stored = localStorage.getItem('pending_records'); if (stored) setPending(JSON.parse(stored)) }, [])

  const syncPending = useCallback(async () => {
    const unsent = pending.filter(p => !p.synced)
    if (!unsent.length || !online) return
    try {
      await fetch('/api/time-records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(unsent) })
      const updated = pending.map(p => ({ ...p, synced: true }))
      setPending(updated)
      localStorage.setItem('pending_records', JSON.stringify(updated))
    } catch {}
  }, [pending, online])

  useEffect(() => { if (online) syncPending() }, [online, syncPending])

  const recordTime = useCallback(async (entry: any) => {
    const timestamp = new Date().toISOString()
    const record: PendingRecord = { id: `${entry.id}-${timestamp}`, entryId: entry.id, checkpointId: checkpointId!, timestamp, synced: false }
    setRecorded(prev => new Set([...prev, entry.id]))
    const newPending = [...pending, record]
    setPending(newPending)
    localStorage.setItem('pending_records', JSON.stringify(newPending))
    const name = entry.athlete ? `${entry.athlete.firstName} ${entry.athlete.lastName}` : entry.relayTeam?.name ?? `#${entry.bibNumber}`
    setLastAction({ entryId: entry.id, time: timestamp, name })
    if (undoTimer) clearTimeout(undoTimer)
    const t = setTimeout(() => setLastAction(null), 15000)
    setUndoTimer(t)
    if (online) {
      try {
        await fetch('/api/time-records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryId: entry.id, checkpointId, timestamp }) })
        const updated = newPending.map(p => p.id === record.id ? { ...p, synced: true } : p)
        setPending(updated)
        localStorage.setItem('pending_records', JSON.stringify(updated))
      } catch {}
    }
  }, [checkpointId, online, pending, undoTimer])

  const undoLast = async () => {
    if (!lastAction) return
    setRecorded(prev => { const next = new Set(prev); next.delete(lastAction.entryId); return next })
    const updated = pending.filter(p => !(p.entryId === lastAction.entryId && p.timestamp === lastAction.time))
    setPending(updated)
    localStorage.setItem('pending_records', JSON.stringify(updated))
    setLastAction(null)
    if (undoTimer) clearTimeout(undoTimer)
  }

  const startPress = (entry: any) => {
    if (recorded.has(entry.id)) return
    pressProgress.current[entry.id] = 0
    progressInterval.current[entry.id] = setInterval(() => {
      pressProgress.current[entry.id] = (pressProgress.current[entry.id] ?? 0) + 10
      setPressing(prev => ({ ...prev, [entry.id]: pressProgress.current[entry.id] }))
      if (pressProgress.current[entry.id] >= 100) {
        clearInterval(progressInterval.current[entry.id])
        delete progressInterval.current[entry.id]
        setPressing(prev => { const n = { ...prev }; delete n[entry.id]; return n })
        recordTime(entry)
      }
    }, 100)
  }

  const cancelPress = (entryId: string) => {
    if (progressInterval.current[entryId]) { clearInterval(progressInterval.current[entryId]); delete progressInterval.current[entryId] }
    setPressing(prev => { const n = { ...prev }; delete n[entryId]; return n })
    pressProgress.current[entryId] = 0
  }

  const pendingCount = pending.filter(p => !p.synced).length
  const activeEntries = entries.filter(e => !recorded.has(e.id) && e.status !== 'dns' && e.status !== 'dsq')
  const doneEntries = entries.filter(e => recorded.has(e.id))

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/timing" className="text-emerald-300 hover:text-white"><ArrowLeft size={20} /></Link>
        <div className="flex-1"><h1 className="font-bold leading-tight">Checkpoint</h1><p className="text-emerald-300 text-xs">{session?.user?.name}</p></div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingCount} čeká</span>}
          {online ? <Wifi size={16} className="text-emerald-300" /> : <WifiOff size={16} className="text-red-300" />}
        </div>
      </header>
      {lastAction && (
        <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
          <span className="text-sm">✓ Zaznamenáno: <strong>{lastAction.name}</strong></span>
          <button onClick={undoLast} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm"><RotateCcw size={14} /> Vrátit</button>
        </div>
      )}
      <div className="p-3">
        {activeEntries.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 px-1">Ještě nezaznamenáno ({activeEntries.length})</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {activeEntries.map((entry: any) => {
                const progress = pressing[entry.id] ?? 0
                const name = entry.athlete ? `${entry.athlete.firstName[0]}. ${entry.athlete.lastName}` : entry.relayTeam?.name ?? ''
                return (
                  <button key={entry.id} onPointerDown={() => startPress(entry)} onPointerUp={() => cancelPress(entry.id)} onPointerLeave={() => cancelPress(entry.id)} onContextMenu={e => e.preventDefault()}
                    className="relative select-none touch-none overflow-hidden bg-white rounded-xl shadow-md p-3 flex flex-col items-center gap-1"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' as any }}>
                    {progress > 0 && <div className="absolute inset-0 bg-orange-400/30" style={{ width: `${progress}%` }} />}
                    <span className="text-2xl font-black leading-none z-10" style={{ color: entry.category?.color ?? '#065f46' }}>{entry.bibNumber}</span>
                    <span className="text-xs text-gray-600 text-center leading-tight z-10 line-clamp-1">{name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full z-10 text-white text-center" style={{ backgroundColor: entry.category?.color ?? '#065f46' }}>{entry.category?.name?.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {doneEntries.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 px-1">Zaznamenáno ({doneEntries.length})</p>
            <div className="grid grid-cols-4 gap-2">{doneEntries.map((entry: any) => (<div key={entry.id} className="bg-gray-200 rounded-xl p-2 flex flex-col items-center gap-0.5 opacity-60"><Check size={12} className="text-emerald-700" /><span className="text-lg font-black text-gray-500">{entry.bibNumber}</span></div>))}</div>
          </div>
        )}
        {entries.length === 0 && <div className="text-center py-16 text-gray-400"><p className="text-lg font-medium">Žádní závodníci</p><p className="text-sm">Zkontrolujte přiřazení sezóny</p></div>}
      </div>
      <div className="fixed bottom-4 left-4 right-4 bg-gray-800/80 text-white text-xs text-center rounded-lg py-2 px-4">Podržte tlačítko 1 sekundu pro zápis času</div>
    </div>
  )
}
