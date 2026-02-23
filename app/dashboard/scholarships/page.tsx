'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await api.get('/admin/scholarships', { params: { limit: 100 } })
      setScholarships(res.data.scholarships || [])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette bourse ?')) return
    await api.delete(`/scholarships/${id}`)
    load()
  }

  const filtered = scholarships.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.provider?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Bourses</h1>
          <p className="text-slate-500 mt-1 text-sm">{scholarships.length} bourses au total</p>
        </div>
        <Link href="/dashboard/scholarships/new"
          className="bg-indigo-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition whitespace-nowrap">
          + Ajouter
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" placeholder="Rechercher une bourse..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Titre</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Fournisseur</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Deadline</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Statut</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Aucune bourse trouvée</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900 text-sm max-w-xs truncate">{s.title}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{s.provider}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {s.deadline ? new Date(s.deadline).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/scholarships/${s.id}/edit`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      Modifier
                    </Link>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
            Aucune bourse trouvée
          </div>
        ) : filtered.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 text-sm leading-snug">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.provider}</p>
              </div>
              <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {s.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                📅 {s.deadline ? new Date(s.deadline).toLocaleDateString('fr-FR') : '-'}
              </p>
              <div className="flex items-center gap-3">
                <Link href={`/dashboard/scholarships/${s.id}/edit`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  Modifier
                </Link>
                <button onClick={() => handleDelete(s.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}