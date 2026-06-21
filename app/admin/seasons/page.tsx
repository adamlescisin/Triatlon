import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SeasonsPage() {
  const seasons = await prisma.season.findMany({
    include: { categories: true },
    orderBy: { year: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sézony</h1>
          <p className="text-gray-500 mt-1">Správa závodních sézon</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Název</th>
              <th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Rok</th>
              <th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Místo</th>
              <th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Stav</th>
              <th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Kategorie</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {seasons.map((season) => (
              <tr key={season.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{season.name}</td>
                <td className="px-6 py-4 text-gray-600">{season.year}</td>
                <td className="px-6 py-4 text-gray-600">{season.location}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    season.status === 'live' ? 'bg-orange-100 text-orange-700' :
                    season.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {season.status === 'live' ? 'Živě' : season.status === 'closed' ? 'Uzavřeno' : 'Příprava'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{season.categories.length}</td>
                <td className="px-6 py-4">
                  <Link href={`/admin/seasons/${season.id}`} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {seasons.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
            <p>Žádné sézony</p>
          </div>
        )}
      </div>
    </div>
  )
}
