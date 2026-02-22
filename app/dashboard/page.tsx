'use client'
import { useEffect, useState } from 'react'
import { scholarshipApi, userApi } from '@/lib/api'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, active: 0, users: 0, applications: 0 })
  const [recentScholarships, setRecentScholarships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes, scholarshipsRes] = await Promise.all([
          scholarshipApi.getStats(),
          userApi.getAll(),
          scholarshipApi.getAll({ limit: 5, sort: 'recent' }),
        ])

        const s = statsRes.data?.stats || statsRes.data
        setStats({
          total: s?.total ?? 0,
          active: s?.active ?? 0,
          users: usersRes.data?.users?.length ?? 0,
          applications: 0,
        })
        setRecentScholarships(scholarshipsRes.data?.scholarships || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  const cards = [
    { label: 'Bourses totales', value: stats.total, icon: '🎓', color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Bourses actives', value: stats.active, icon: '✅', color: 'bg-green-50 text-green-700' },
    { label: 'Utilisateurs', value: stats.users, icon: '👥', color: 'bg-blue-50 text-blue-700' },
    { label: 'Candidatures', value: stats.applications, icon: '📝', color: 'bg-purple-50 text-purple-700' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Vue d'ensemble de ScholarHub</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Bourses récentes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Bourses récentes</h2>
          <Link href="/dashboard/scholarships" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Voir tout →
          </Link>
        </div>
        {recentScholarships.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Aucune bourse pour le moment</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentScholarships.map(s => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{s.title}</p>
                  <p className="text-xs text-slate-500">{s.provider}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Link href={`/dashboard/scholarships/${s.id}/edit`} className="text-xs text-indigo-600 hover:text-indigo-800">
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: '/dashboard/scholarships/new', label: '+ Ajouter une bourse', color: 'bg-indigo-600 text-white hover:bg-indigo-700' },
            { href: '/dashboard/users', label: '👥 Voir les utilisateurs', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
            { href: '/dashboard/support', label: '💬 Demandes d\'assistance', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
          ].map((action) => (
            <Link key={action.href} href={action.href}
              className={`${action.color} rounded-xl px-4 py-3 text-sm font-medium text-center transition`}>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}