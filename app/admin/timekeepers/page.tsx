import { prisma } from '@/lib/prisma'
import { Timer } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TimeKeepersPage() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['timekeeper', 'announcer'] } },
    include: {
      timekeeperTeamMembers: { include: { team: { include: { category: { include: { season: true } } } } } },
    },
    orderBy: { name: 'asc' },
  })

  const roleLabel: Record<string, string> = { timekeeper: 'Časomiřič', announcer: 'Hlasatel', admin: 'Admin' }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Časomiřiči</h1>
          <p className="text-gray-500 mt-1">Správa uživatelů měřicího systému</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <Timer size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">Žádní časomiřiči</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Jméno</th>
                <th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Uživatelské jméno</th>
                <th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Role</th>
                <th className="text-left px-6 py-3 text-gray-500 text-sm font-medium">Přiřazení</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'timekeeper' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>{roleLabel[u.role]}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {u.timekeeperTeamMembers.map((m: any) => m.team?.category?.name).filter(Boolean).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Přihlašovací údaje (demo):</strong>
        <ul className="mt-2 space-y-1 font-mono">
          <li>admin / admin123</li>
          <li>timekeeper1 / timer123</li>
          <li>announcer1 / announce123</li>
        </ul>
      </div>
    </div>
  )
}
