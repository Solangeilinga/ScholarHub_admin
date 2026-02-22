'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { removeToken } from '@/lib/auth'

const links = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/scholarships', icon: '🎓', label: 'Bourses' },
  { href: '/dashboard/users', icon: '👥', label: 'Utilisateurs' },
  { href: '/dashboard/support', icon: '💬', label: 'Assistance' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const logout = () => {
    removeToken()
    router.push('/')
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🎓</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">ScholarHub</p>
            <p className="text-xs text-slate-500">Panel Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <span>🚪</span> Déconnexion
        </button>
      </div>
    </aside>
  )
}