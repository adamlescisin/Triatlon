'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, Users } from 'lucide-react'

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', emergencyContact: '' })
  const [saving, setSaving] = useState(false)

  const fetchAthletes = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/athletes?q=${encodeURIComponent(q)}`)
    setAthletes(await res.json())
    setLoading(false)
  }, [q])

  useEffect(() => {
    const t = setTimeout(fetchAthletes, 300)
    return () => clearTimeout(t)
  }, [fetchAthletes])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/athletes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const athlete = await res.json()
    setAthletes(prev => [athlete, ...prev])
    setShowForm(false)
    setForm({ firstName: '', lastName: '', dateOfBirth: '', emergencyContact: '' })
    setSaving(false)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-bold text-gray-900">Závodníci</h1><p className="text-gray-500 mt-1">Správa startovního pole</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Přidat závodníka
        </button>
      </div>
      <div className="bg-white rounded-xl shadow mb-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Hledat podle jména..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
        </div>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <h2 className="text-lg font-bold mb-4">Nový závodník</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Jméno</label><input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Příjmení</label><input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Datum narození</label><input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nouzoý kontakt</label><input value={form.emergencyContact} onChange={e => setForm(p => ({ ...p, emergencyContact: e.target.value }))} placeholder="+420 xxx xxx xxx" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.firstName || !form.lastName} className="bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">{saving ? 'Ukládám...' : 'Uložit'}</button>
            <button onClick={() => setShowForm(false)} className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100">Zrušit</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Načítání...</div> : athletes.length === 0 ? (
          <div className="p-12 text-center"><Users size={48} className="mx-auto mb-3 text-gray-300" /><p className="text-gray-400">Žádní závodníci</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr><th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Jméno</th><th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Věk</th><th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Starts</th><th className="px-6 py-3"></th></tr></thead>
            <tbody className="divide-y">{athletes.map((a: any) => {
              const age = a.dateOfBirth ? Math.floor((Date.now() - new Date(a.dateOfBirth).getTime()) / 31557600000) : null
              return (<tr key={a.id} className="hover:bg-gray-50"><td className="px-6 py-4"><p className="font-medium text-gray-900">{a.firstName} {a.lastName}</p></td><td className="px-6 py-4 text-gray-600">{age ?? '—'}</td><td className="px-6 py-4 text-gray-600">{a.entries?.length ?? 0}</td><td className="px-6 py-4"><Link href={`/admin/athletes/${a.id}`} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Detail</Link></td></tr>)
            })}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
