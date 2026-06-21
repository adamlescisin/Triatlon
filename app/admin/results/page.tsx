import { prisma } from '@/lib/prisma'
import { Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatTime(ts: Date) {
  return new Date(ts).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default async function ResultsAuditPage() {
  const records = await prisma.timeRecord.findMany({
    include: {
      entry: { include: { athlete: true, category: true } },
      checkpoint: true,
      timekeeper: { select: { name: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="p-8">
      <div className="mb-6"><h1 className="text-3xl font-bold text-gray-900">Záznamy časů</h1><p className="text-gray-500 mt-1">Audit log — posledních 100 záznamů</p></div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {records.length === 0 ? (
          <div className="p-12 text-center"><Clock size={48} className="mx-auto mb-3 text-gray-300" /><p className="text-gray-400">Žádné záznamy</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr><th className="text-left px-4 py-3 text-gray-500 font-medium">Čas</th><th className="text-left px-4 py-3 text-gray-500 font-medium">Závodník</th><th className="text-left px-4 py-3 text-gray-500 font-medium">Číslo</th><th className="text-left px-4 py-3 text-gray-500 font-medium">Checkpoint</th><th className="text-left px-4 py-3 text-gray-500 font-medium">Časoměřič</th><th className="text-left px-4 py-3 text-gray-500 font-medium">Poznámka</th></tr></thead>
            <tbody className="divide-y">{records.map((r: any) => (
              <tr key={r.id} className={`hover:bg-gray-50 ${r.isCorrection ? 'bg-yellow-50' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-700">{formatTime(r.timestamp)}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.entry?.category?.color }} />{r.entry?.athlete ? `${r.entry.athlete.firstName} ${r.entry.athlete.lastName}` : r.entry?.id?.slice(0, 8)}</div></td>
                <td className="px-4 py-3 font-bold">#{r.entry?.bibNumber}</td>
                <td className="px-4 py-3 text-gray-600">{r.checkpoint?.label}</td>
                <td className="px-4 py-3 text-gray-600">{r.timekeeper?.name}</td>
                <td className="px-4 py-3 text-gray-500 italic">{r.note ?? (r.isCorrection ? '⚠ Korekce' : '')}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
