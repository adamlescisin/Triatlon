'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Timer, Wifi, WifiOff } from 'lucide-react'

const CHECKPOINT_LABELS: Record<string, string> = {
  start: 'Start',
  depot1: 'Depo 1 (Plavání → Kolo)',
  depot2: 'Depo 2 (Kolo → Běh)',
  finish: 'Cíl',
  lap: 'Otočky',
}

const CHECKPOINT_ICONS: Record<string, string> = {
  start: '🏄',
  depot1: '🔄',
  depot2: '🔄',
  finish: '🏁',
  lap: '🌊',
}

export default function TimingHomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [seasons, setSeasons] = useState<any[]>([])
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  useEffect(() => {
    fetch('/api/seasons').then(r => r.json()).then(setSeasons)
  }, [])

  const activeSeason = seasons.find(s => s.status === 'live') ?? seasons[0]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-emerald-800 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Timer size={24} />
          <div>
            <h1 className="font-bold text-lg leading-tight">Časoměřič</h1>
            <p className="text-emerald-300 text-xs">{session?.user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {online ? <Wifi size={18} className="text-emerald-300" /> : <WifiOff size={18} className="text-red-300" />}
          <span className={`text-xs ${online ? 'text-emerald-300' : 'text-red-300'}`}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </header>

      <div className="p-4">
        {!activeSeason ? (
          <div className="text-center py-16 text-gray-500">
            <Timer size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Žádný aktivní závod</p>
            <p className="text-sm">Kontaktujte administrátora</p>
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-xl shadow p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-orange-600 font-bold text-sm">ŽIVĚ</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{activeSeason.name}</h2>
              <p className="text-gray-500 text-sm">{activeSeason.location}</p>
            </div>

            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 px-1">Vyberte checkpoint</h3>
            <div className="space-y-3">
              {activeSeason.checkpoints?.map((cp: any) => (
                <button
                  key={cp.id}
                  onClick={() => router.push(`/timing/${cp.type}?checkpointId=${cp.id}&seasonId=${activeSeason.id}`)}
                  className="w-full bg-white rounded-xl shadow p-5 flex items-center gap-4 text-left hover:bg-emerald-50 active:scale-98 transition-all"
                >
                  <span className="text-3xl">{CHECKPOINT_ICONS[cp.type] ?? '⏱'}</span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{cp.label}</p>
                    <p className="text-gray-500 text-sm">{CHECKPOINT_LABELS[cp.type]}</p>
                  </div>
                  <span className="ml-auto text-gray-300 text-2xl">›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
