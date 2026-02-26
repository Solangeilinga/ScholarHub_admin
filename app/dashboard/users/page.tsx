'use client'
import { useEffect, useState } from 'react'
import { userApi } from '@/lib/api'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await userApi.getAll()
      setUsers(res.data.users || [])
    } finally {
      setLoading(false)
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (<div className="space-y-6 md:space-y-8">
  {/* Header */}
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6 mb-4 md:mb-6">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Utilisateurs</h1>
      <p className="text-base md:text-lg text-slate-500 mt-1">{users.length} comptes enregistrés</p>
    </div>
  </div>

  {/* Search */}
  <div className="mb-5">
    <input
      type="text"
      placeholder="Rechercher un utilisateur..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full border border-slate-200 rounded-xl px-4 py-3 md:px-5 md:py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>

  {/* Desktop table */}
  <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto">
    <table className="w-full">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-6 py-5 text-left text-sm md:text-base font-semibold text-slate-500 uppercase">Utilisateur</th>
          <th className="px-6 py-5 text-left text-sm md:text-base font-semibold text-slate-500 uppercase">Pays</th>
          <th className="px-6 py-5 text-left text-sm md:text-base font-semibold text-slate-500 uppercase">Niveau</th>
          <th className="px-6 py-5 text-left text-sm md:text-base font-semibold text-slate-500 uppercase">Rôle</th>
          <th className="px-6 py-5 text-left text-sm md:text-base font-semibold text-slate-500 uppercase">Inscription</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {loading ? (
          <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-base md:text-lg">Chargement...</td></tr>
        ) : filtered.length === 0 ? (
          <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-base md:text-lg">Aucun utilisateur trouvé</td></tr>
        ) : filtered.map((u) => (
          <tr key={u.id} className="hover:bg-slate-50 transition">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-base md:text-lg font-bold">
                  {(u.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-base md:text-lg">{u.name}</p>
                  <p className="text-sm md:text-base text-slate-500">{u.email}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-base md:text-lg text-slate-500">{u.country || '-'}</td>
            <td className="px-6 py-4 text-base md:text-lg text-slate-500">{u.level || '-'}</td>
            <td className="px-6 py-4">
              <span className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                {u.role}
              </span>
            </td>
            <td className="px-6 py-4 text-base md:text-lg text-slate-500">
              {new Date(u.createdAt).toLocaleDateString('fr-FR')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Mobile cards */}
  <div className="md:hidden space-y-4">
    {loading ? (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center text-base md:text-lg text-slate-400">
        Chargement...
      </div>
    ) : filtered.length === 0 ? (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center text-base md:text-lg text-slate-400">
        Aucun utilisateur trouvé
      </div>
    ) : filtered.map((u) => (
      <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-base md:text-lg font-bold">
              {(u.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-base md:text-lg text-slate-900">{u.name}</p>
              <p className="text-sm md:text-base text-slate-500">{u.email}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
            {u.role}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm md:text-base text-slate-500">
            📅 {new Date(u.createdAt).toLocaleDateString('fr-FR')}
          </p>
          <p className="text-sm md:text-base text-slate-500">{u.country || '-'}</p>
          <p className="text-sm md:text-base text-slate-500">{u.level || '-'}</p>
        </div>
      </div>
    ))}
  </div>
</div>
  )
}