'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Calendar, Users, Clock, Mic, LogOut, Timer } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/seasons', label: 'Sézony', icon: Calendar },
  { href: '/admin/athletes', label: 'Závodníci', icon: Users },
  { href: '/admin/timekeepers', label: 'Časomiřiči', icon: Timer },
  { href: '/admin/results', label: 'Záznamy', icon: Clock },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-emerald-900 text-white flex flex-col">
        <div className="p-6 border-b border-emerald-800">
          <h1 className="text-xl font-bold">Hostín Triatlon</h1>
          <p className="text-emerald-300 text-sm mt-1">Administrace</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active ? 'bg-emerald-700 text-white' : 'text-emerald-200 hover:bg-emerald-800'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-emerald-800 space-y-2">
          <Link href="/timing" className="flex items-center gap-3 px-3 py-2 rounded-lg text-orange-300 hover:bg-emerald-800 transition-colors">
            <Timer size={18} />
            Časomiřič
          </Link>
          <Link href="/announcer" className="flex items-center gap-3 px-3 py-2 rounded-lg text-orange-300 hover:bg-emerald-800 transition-colors">
            <Mic size={18} />
            Hlasatel
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-emerald-400 hover:bg-emerald-800 transition-colors w-full"
          >
            <LogOut size={18} />
            Odhlásit se
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
