'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api, { scraperApi } from '@/lib/api'

type Tab = 'all' | 'pending'

export default function ScholarshipsPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [scholarships, setScholarships] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => { loadAll() }, [])

const loadAll = async () => {
  setLoading(true)
  try {
    const [allRes, pendingRes, statsRes] = await Promise.all([
      api.get('/admin/scholarships', { params: { limit: 100 } }),
      scraperApi.getPending(),
      scraperApi.getStats(),
    ])
    setScholarships(allRes.data.scholarships || [])
    setPending(pendingRes.data.scholarships || [])
    setPendingCount(statsRes.data.stats?.pending || 0)
  } finally {
    setLoading(false)
  }
}

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette bourse ?')) return
    await api.delete(`/scholarships/${id}`)
    loadAll()
  }

const handleApprove = async (id: string) => {
  await scraperApi.approve(id)
  loadAll()
}

const handleReject = async (id: string) => {
  await scraperApi.reject(id)
  loadAll()
}

const handleApproveAll = async () => {
  if (!confirm(`Approuver les ${selected.length} bourses sélectionnées ?`)) return
  await scraperApi.approveAll(selected)
  setSelected([])
  loadAll()
}

const handleRunScraping = async () => {
  await scraperApi.run()
  alert('Scraping lancé ! Les résultats apparaîtront dans quelques minutes.')
}

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const filtered = scholarships.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.provider?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 md:space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Bourses</h1>
          <p className="text-base md:text-lg text-slate-500 mt-1">{scholarships.length} bourses au total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunScraping}
            className="bg-slate-100 text-slate-700 px-4 py-3 rounded-xl text-base font-semibold hover:bg-slate-200 transition whitespace-nowrap"
          >
            🔍 Scraper
          </button>
          <Link
            href="/dashboard/scholarships/new"
            className="bg-indigo-600 text-white px-4 py-3 md:px-5 rounded-xl text-base md:text-lg font-semibold hover:bg-indigo-700 transition whitespace-nowrap"
          >
            + Ajouter
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('all')}
          className={`px-5 py-2.5 rounded-lg text-base font-medium transition ${tab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Toutes ({scholarships.length})
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`px-5 py-2.5 rounded-lg text-base font-medium transition flex items-center gap-2 ${tab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          En attente
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab Toutes ── */}
      {tab === 'all' && (
        <>
          <div>
            <input
              type="text"
              placeholder="Rechercher une bourse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 md:px-5 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500 uppercase">Titre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500 uppercase">Fournisseur</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500 uppercase">Deadline</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500 uppercase">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-base">Chargement...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-base">Aucune bourse trouvée</td></tr>
                ) : filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="text-base font-medium text-slate-900 truncate max-w-xs">{s.title}</p>
                      {s.source && <p className="text-xs text-slate-400 mt-0.5">🔍 Scrapé</p>}
                    </td>
                    <td className="px-6 py-4 text-base text-slate-500">{s.provider}</td>
                    <td className="px-6 py-4 text-base text-slate-500">
                      {s.deadline ? new Date(s.deadline).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/dashboard/scholarships/${s.id}/edit`} className="text-base text-indigo-600 hover:text-indigo-800 font-medium">Modifier</Link>
                        <button onClick={() => handleDelete(s.id)} className="text-base text-red-500 hover:text-red-700 font-medium">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400">Aucune bourse trouvée</div>
            ) : filtered.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-slate-900 leading-snug">{s.title}</p>
                    <p className="text-sm text-slate-500 mt-1">{s.provider}</p>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">📅 {s.deadline ? new Date(s.deadline).toLocaleDateString('fr-FR') : '-'}</p>
                  <div className="flex items-center gap-4">
                    <Link href={`/dashboard/scholarships/${s.id}/edit`} className="text-base text-indigo-600 font-medium">Modifier</Link>
                    <button onClick={() => handleDelete(s.id)} className="text-base text-red-500 font-medium">Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Tab En attente ── */}
      {tab === 'pending' && (
        <div className="space-y-4">

          {/* Barre sélection multiple */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-base text-indigo-700 font-medium">{selected.length} bourse(s) sélectionnée(s)</p>
              <button
                onClick={handleApproveAll}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
              >
                ✅ Approuver la sélection
              </button>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">Chargement...</div>
          ) : pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-lg font-semibold text-slate-900">Aucune bourse en attente</p>
              <p className="text-base text-slate-500 mt-1">Toutes les bourses scrapées ont été traitées</p>
              <button onClick={handleRunScraping} className="mt-4 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-200 transition">
                🔍 Lancer un scraping
              </button>
            </div>
          ) : pending.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-2xl border p-5 transition ${selected.includes(s.id) ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200'}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  onChange={() => toggleSelect(s.id)}
                  className="mt-1 w-4 h-4 accent-indigo-600 shrink-0 cursor-pointer"
                />

                <div className="flex-1 min-w-0">
                  {/* Titre + actions */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-slate-900">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm text-slate-500">{s.provider}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-sm text-slate-400">
                          📅 {s.deadline ? new Date(s.deadline).toLocaleDateString('fr-FR') : 'Non définie'}
                        </span>
                        {s.source && (
                          <>
                            <span className="text-slate-300">·</span>
                            <a href={s.source} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-indigo-500 hover:underline">
                              🔍 Source
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/dashboard/scholarships/${s.id}/edit`}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition">
                        ✏️ Modifier
                      </Link>
                      <button onClick={() => handleApprove(s.id)}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200 transition">
                        ✅ Approuver
                      </button>
                      <button onClick={() => handleReject(s.id)}
                        className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition">
                        ❌ Rejeter
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">{s.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{s.type}</span>
                    {s.level?.slice(0, 2).map((l: string) => (
                      <span key={l} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs">{l}</span>
                    ))}
                    {s.countries?.slice(0, 3).map((c: string) => (
                      <span key={c} className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}