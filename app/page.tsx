import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let activeSeason = null
  try {
    activeSeason = await prisma.season.findFirst({
      where: { status: 'live' },
      include: { categories: true },
    })
  } catch {}

  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <header className="bg-emerald-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Hostin Triatlon</h1>
            <p className="text-emerald-300 mt-1">Vysledky a Casomira</p>
          </div>
          <div className="flex gap-3">
            <Link href="/results" className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Vysledky
            </Link>
            <Link href="/login" className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Prihlasit se
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {activeSeason ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              ZIVE
            </div>
            <h2 className="text-4xl font-bold mb-4">{activeSeason.name}</h2>
            <p className="text-emerald-300 text-lg mb-8">Zavod prave probiha</p>
            <Link href="/results" className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-xl text-xl font-bold transition-colors">
              Zobrazit zive vysledky
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Vitejte na Hostin Triatlonu</h2>
            <p className="text-emerald-300 text-xl mb-8">Zadny aktivni zavod</p>
            <Link href="/results" className="bg-emerald-700 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl text-xl font-bold transition-colors">
              Zobrazit archiv vysledku
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
