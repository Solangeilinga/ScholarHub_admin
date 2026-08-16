'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // null = vérification pas encore faite, true/false = résultat connu.
  // Tant que c'est null, on n'affiche RIEN du contenu protégé — ça évite
  // que les pages enfants lancent leurs appels API avant même que la
  // redirection vers le login ait eu le temps de se déclencher.
  const [authChecked, setAuthChecked] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/')
      return
    }
    setAuthChecked(true)
  }, [router])

  if (authChecked !== true) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🎓</span>
            </div>
            <span className="font-bold text-slate-900 text-sm">ScholarHub Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 transition"
          >
            <div className="flex flex-col gap-1.5">
              <span className="block w-5 h-0.5 bg-slate-700 rounded" />
              <span className="block w-5 h-0.5 bg-slate-700 rounded" />
              <span className="block w-5 h-0.5 bg-slate-700 rounded" />
            </div>
          </button>
        </header>

        {/* Contenu */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}