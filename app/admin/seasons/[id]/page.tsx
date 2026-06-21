'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Check, X } from 'lucide-react'

const COLORS = ['#3b82f6','#ec4899','#8b5cf6','#f59e0b','#10b981','#ef4444','#06b6d4','#f97316']

export default function SeasonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [season, setSeason] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', color: COLORS[0], type: 'individual', startOrder: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/seasons/${id}`).then(r => r.json()).then(setSeason).finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (status: string) => {
    await fetch(`/api/seasons/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setSeason((s: any) => ({ ...s, status }))
  }

  const addCategory = async () => {
    setSaving(true)
    const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newCategory, seasonId: id }) })
    const cat = await res.json()
    setSeason((s: any) => ({ ...s, categories: [...s.categories, { ...cat, entries: [] }] }))
    setShowCategoryForm(false)
    setNewCategory({ name: '', color: COLORS[0], type: 'individual', startOrder: 0 })
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-gray-500">Načítání...</div>
  if (!season) return <div className="p-8 text-red-500">Sezóna nenalezena</div>

  const statusColors: Record<string, string> = { preparing: 'bg-emerald-100 text-emerald-700', live: 'bg-orange-100 text-orange-700', closed: 'bg-gray-100 text-gray-600' }
  const statusLabels: Record<string, string> = { preparing: 'Příprava', live: 'Živě', closed: 'Uzavřeno' }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/seasons" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div><h1 className="text-3xl font-bold text-gray-900">{season.name}</h1><p className="text-gray-500">{season.location} · {season.year}</p></div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-gray-500 mb-1">Stav závodu</p><span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[season.status]}`}>{statusLabels[season.status]}</span></div>
          <div className="flex gap-2">
            {season.status === 'preparing' && <button onClick={() => updateStatus('live')} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Spustit závod (LIVE)</button>}
            {season.status === 'live' && <button onClick={() => updateStatus('closed')} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Uzavřít závod</button>}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Checkpointy</h2>
        <div className="flex flex-wrap gap-2">{season.checkpoints?.map((cp: any) => (<span key={cp.id} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">{cp.order}. {cp.label}</span>))}</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Kategorie</h2>
          <button onClick={() => setShowCategoryForm(true)} className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm"><Plus size={16} /> Přidat kategorii</button>
        </div>
        {showCategoryForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Název</label><input value={newCategory.name} onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Typ</label><select value={newCategory.type} onChange={e => setNewCategory(p => ({ ...p, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="individual">Jednotlivci</option><option value="relay">Štafety</option></select></div>
            </div>
            <div className="mb-3"><label className="block text-xs font-medium text-gray-600 mb-1">Barva</label><div className="flex gap-2">{COLORS.map(c => (<button key={c} onClick={() => setNewCategory(p => ({ ...p, color: c }))} className={`w-8 h-8 rounded-full border-2 ${newCategory.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />))}</div></div>
            <div className="flex gap-2">
              <button onClick={addCategory} disabled={saving || !newCategory.name} className="flex items-center gap-1 bg-emerald-800 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"><Check size={14} /> Uložit</button>
              <button onClick={() => setShowCategoryForm(false)} className="flex items-center gap-1 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-100"><X size={14} /> Zrušit</button>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {season.categories?.map((cat: any) => (
            <div key={cat.id} className="flex items-center gap-3 p-4 border rounded-lg">
              <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <div className="flex-1"><p className="font-medium text-gray-900">{cat.name}</p><p className="text-xs text-gray-500">{cat.type === 'relay' ? 'Štafety' : 'Jednotlivci'} · {cat.entries?.length ?? 0} závodníků</p></div>
            </div>
          ))}
          {season.categories?.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Žádné kategorie</p>}
        </div>
      </div>
    </div>
  )
}
