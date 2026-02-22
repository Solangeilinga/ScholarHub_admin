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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
        <p className="text-slate-500 mt-1">{users.length} comptes enregistrés</p>
      </div>

      <input
        type="text"
        placeholder="Rechercher un utilisateur..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Utilisateur</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Pays</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Niveau</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Rôle</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Inscription</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Chargement...</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {(u.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{u.country || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{u.level || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}