import { prisma } from '@/lib/prisma'
import { Calendar, Users, Clock, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [seasonCount, athleteCount, recentRecords, activeSeason] = await Promise.all([
    prisma.season.count(),
    prisma.athlete.count(),
    prisma.timeRecord.count(),
    prisma.season.findFirst({ where: { status: 'live' }, include: { categories: { include: { entries: true } } } }),
  ])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Prehled zavodu</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-emerald-600" />
            <span className="text-gray-500 text-sm">Sezony</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{seasonCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-emerald-600" />
            <span className="text-gray-500 text-sm">Zavodnici</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{athleteCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-emerald-600" />
            <span className="text-gray-500 text-sm">Zaznamy casu</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{recentRecords}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-orange-600" />
            <span className="text-gray-500 text-sm">Stav zavodu</span>
          </div>
          <p className={`text-lg font-bold ${activeSeason ? 'text-orange-600' : 'text-gray-400'}`}>
            {activeSeason ? 'ZIVE' : 'Neaktivni'}
          </p>
        </div>
      </div>

      {activeSeason && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{activeSeason.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeSeason.categories.map((cat) => (
              <div key={cat.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium">{cat.name}</span>
                </div>
                <p className="text-2xl font-bold">{cat.entries.length}</p>
                <p className="text-gray-500 text-sm">zavodnik</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
