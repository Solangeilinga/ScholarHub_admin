'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { removeToken } from '@/lib/auth'

const links = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/scholarships', icon: '🎓', label: 'Bourses' },
  { href: '/dashboard/users', icon: '👥', label: 'Utilisateurs' },
  { href: '/dashboard/support', icon: '💬', label: 'Assistance' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = () => {
    removeToken()
    router.push('/')
  }

  return (
    <>
      {/* Overlay mobile */}
     <aside className={`fixed top-0 left-0 h-full z-30 w-64 bg-white border-r border-slate-200 flex flex-col
  transition-transform duration-300 ease-in-out
  ${open ? 'translate-x-0' : '-translate-x-full'}
  lg:static lg:translate-x-0 lg:z-auto
`}>
  {/* Logo + close btn mobile */}
  <div className="p-6 border-b border-slate-200 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="relative w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center overflow-hidden">
        <span className="text-white text-2xl" aria-hidden>
          🎓
        </span>
        <Image
          src="/logo.png"
          alt="ScholarHub logo"
          fill
          sizes="48px"
          className="absolute inset-0 object-contain bg-white p-1"
          priority
        />
      </div>
      <div>
        <p className="font-bold text-slate-900 text-lg">ScholarHub</p>
        <p className="text-sm text-slate-500">Panel Admin</p>
      </div>
    </div>
    <button
      onClick={onClose}
      className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
    >
      ✕
    </button>
  </div>

  {/* Nav */}
  <nav className="flex-1 p-5 space-y-2">
    {links.map((link) => {
      const isActive = pathname === link.href
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClose}
          className={`flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium transition ${
            isActive
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="text-lg">{link.icon}</span>
          {link.label}
        </Link>
      )
    })}
  </nav>

  {/* Logout */}
  <div className="p-5 border-t border-slate-200">
    <button
      onClick={logout}
      className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition"
    >
      <span className="text-lg">🚪</span> Déconnexion
    </button>
  </div>
</aside>
    </>
  )
}
