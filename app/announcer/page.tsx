'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Mic, Send, Clock } from 'lucide-react'

const CHECKPOINT_OPTIONS = [
  { value: 'depot1', label: 'Depo 1 (Plavání → Kolo)' },
  { value: 'depot2', label: 'Depo 2 (Kolo → Běh)' },
  { value: 'finish', label: 'Cíl' },
]

export default function AnnouncerPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [selectedEntry, setSelectedEntry] = useState<string>('')
  const [checkpoint, setCheckpoint] = useState('finish')
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/seasons').then(r => r.json()).then((seasons: any[]) => {
      const live = seasons.find(s => s.status === 'live') ?? seasons[0]
      if (live) fetch(`/api/entries?seasonId=${live.id}`).then(r => r.json()).then(setEntries)
    })
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = () => {
    fetch('/api/announcer-alerts?limit=10').then(r => r.json()).then(setAlerts)
  }

  const sendAlert = async () => {
    if (!selectedEntry && !customMessage) return
    setSending(true)
    const entry = entries.find(e => e.id === selectedEntry)
    const athleteName = entry?.athlete ? `${entry.athlete.firstName} ${entry.athlete.lastName}` : entry?.relayTeam?.name ?? ''
    const cpLabel = CHECKPOINT_OPTIONS.find(c => c.value === checkpoint)?.label ?? checkpoint
    const message = customMessage || (entry ? `Závodník č. ${entry.bibNumber}, ${athleteName} (${entry.category?.name}), se blíží — ${cpLabel}` : 'Oznámení')
    await fetch('/api/announcer-alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryId: entry?.id, checkpointType: checkpoint, message }) })
    setSending(false)
    setSelectedEntry('')
    setCustomMessage('')
    fetchAlerts()
  }

  const filtered = entries.filter(e => {
    if (!search) return true
    const name = e.athlete ? `${e.athlete.firstName} ${e.athlete.lastName}` : e.relayTeam?.name ?? ''
    return name.toLowerCase().includes(search.toLowerCase()) || String(e.bibNumber).includes(search)
  })

  const selectedEntryObj = entries.find(e => e.id === selectedEntry)

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-emerald-800 text-white px-4 py-4 flex items-center gap-3">
        <Mic size={24} />
        <div><h1 className="font-bold text-lg">Hlasatel</h1><p className="text-emerald-300 text-xs">{session?.user?.name}</p></div>
      </header>
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold text-gray-900 mb-3">Nové oznámení</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Checkpoint</label>
            <div className="grid grid-cols-3 gap-2">{CHECKPOINT_OPTIONS.map(opt => (<button key={opt.value} onClick={() => setCheckpoint(opt.value)} className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${checkpoint === opt.value ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'}`}>{opt.label.split('(')[0].trim()}</button>))}</div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Závodník (volitelné)</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat jméno nebo číslo..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2" />
            <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
              <button onClick={() => { setSelectedEntry(''); setSearch('') }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${!selectedEntry ? 'bg-emerald-50 text-emerald-700 font-medium' : ''}`}>Žádný (vlastní zpráva)</button>
              {filtered.slice(0, 20).map(e => {
                const name = e.athlete ? `${e.athlete.firstName} ${e.athlete.lastName}` : e.relayTeam?.name ?? `#${e.bibNumber}`
                return (<button key={e.id} onClick={() => { setSelectedEntry(e.id); setSearch('') }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${selectedEntry === e.id ? 'bg-emerald-50 text-emerald-700 font-medium' : ''}`}><span className="font-bold w-8 text-center" style={{ color: e.category?.color }}>#{e.bibNumber}</span><span>{name}</span><span className="text-xs text-gray-400 ml-auto">{e.category?.name}</span></button>)
              })}
            </div>
          </div>
          {!selectedEntryObj && (<div className="mb-3"><label className="block text-sm font-medium text-gray-700 mb-1">Vlastní zpráva</label><textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Napište oznámení..." /></div>)}
          <button onClick={sendAlert} disabled={sending || (!selectedEntry && !customMessage)} className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-colors">
            <Send size={18} />{sending ? 'Odesílám...' : 'Odeslat oznámení'}
          </button>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Clock size={18} className="text-gray-400" />Poslední oznámení</h2>
          {alerts.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">Žádná oznámení</p> : (
            <div className="space-y-2">{alerts.map((alert: any) => (<div key={alert.id} className="border rounded-lg p-3"><p className="text-sm text-gray-800">{alert.message}</p><p className="text-xs text-gray-400 mt-1">{new Date(alert.createdAt).toLocaleTimeString('cs-CZ')} · {alert.author?.name}</p></div>))}</div>
          )}
        </div>
      </div>
    </div>
  )
}
