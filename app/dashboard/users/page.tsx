'use client'
import { useEffect, useState } from 'react'
import { userApi } from '@/lib/api'
import { getCurrentUserId } from '@/lib/auth'

type User = {
  id: string
  name: string
  email: string
  country?: string
  level?: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const currentUserId = getCurrentUserId()

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await userApi.getAll()
      setUsers((res as any).data.users || [])
    } finally {
      setLoading(false)
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleRole = async (u: User) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN'
    const label = newRole === 'ADMIN' ? 'promouvoir en administrateur' : 'rétrograder en utilisateur simple'
    if (!confirm(`Confirmer : ${label} le compte "${u.name}" ?`)) return

    setError('')
    setBusyId(u.id)
    try {
      await userApi.updateRole(u.id, newRole)
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)))
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Une erreur est survenue')
    } finally {
      setBusyId(null)
    }
  }

  const handleResetPassword = async (u: User) => {
    if (!confirm(`Envoyer un lien de réinitialisation de mot de passe à "${u.email}" ?`)) return

    setError('')
    setBusyId(u.id)
    try {
      await userApi.resetPassword(u.id)
      alert(`Lien envoyé à ${u.email}`)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Une erreur est survenue')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Confirmer la suppression définitive du compte "${u.name}" (${u.email}) ?`)) return

    setError('')
    setBusyId(u.id)
    try {
      await userApi.delete(u.id)
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Une erreur est survenue')
    } finally {
      setBusyId(null)
    }
  }

  return (<div className="space-y-6 md:space-y-8">
  {/* Header */}
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6 mb-4 md:mb-6">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Utilisateurs</h1>
      <p className="text-base md:text-lg text-slate-500 mt-1">{users.length} comptes enregistrés</p>
    </div>
    <button
      onClick={() => setShowAddModal(true)}
      className="bg-indigo-600 text-white rounded-xl px-5 py-3 md:px-6 md:py-4 text-base md:text-lg font-semibold hover:bg-indigo-700 transition whitespace-nowrap"
    >
      + Ajouter un administrateur
    </button>
  </div>

  {error && (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-base">
      {error}
    </div>
  )}

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
          <th className="px-6 py-5 text-right text-sm md:text-base font-semibold text-slate-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {loading ? (
          <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-base md:text-lg">Chargement...</td></tr>
        ) : filtered.length === 0 ? (
          <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-base md:text-lg">Aucun utilisateur trouvé</td></tr>
        ) : filtered.map((u) => (
          <tr key={u.id} className="hover:bg-slate-50 transition">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-base md:text-lg font-bold">
                  {(u.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-base md:text-lg">
                    {u.name} {u.id === currentUserId && <span className="text-sm text-slate-400">(vous)</span>}
                  </p>
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
            <td className="px-6 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  disabled={busyId === u.id}
                  onClick={() => handleResetPassword(u)}
                  className="px-3 py-2 text-sm md:text-base rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
                >
                  🔑 Reset mdp
                </button>
                <button
                  disabled={busyId === u.id || (u.id === currentUserId && u.role === 'ADMIN')}
                  onClick={() => handleToggleRole(u)}
                  className="px-3 py-2 text-sm md:text-base rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title={u.id === currentUserId && u.role === 'ADMIN' ? 'Vous ne pouvez pas vous rétrograder vous-même' : ''}
                >
                  {u.role === 'ADMIN' ? 'Rétrograder' : 'Promouvoir admin'}
                </button>
                <button
                  disabled={busyId === u.id || u.id === currentUserId}
                  onClick={() => handleDelete(u)}
                  className="px-3 py-2 text-sm md:text-base rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title={u.id === currentUserId ? 'Vous ne pouvez pas supprimer votre propre compte' : ''}
                >
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
              <p className="font-medium text-base md:text-lg text-slate-900">
                {u.name} {u.id === currentUserId && <span className="text-sm text-slate-400">(vous)</span>}
              </p>
              <p className="text-sm md:text-base text-slate-500">{u.email}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
            {u.role}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <p className="text-sm md:text-base text-slate-500">
            📅 {new Date(u.createdAt).toLocaleDateString('fr-FR')}
          </p>
          <p className="text-sm md:text-base text-slate-500">{u.country || '-'}</p>
          <p className="text-sm md:text-base text-slate-500">{u.level || '-'}</p>
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button
            disabled={busyId === u.id}
            onClick={() => handleResetPassword(u)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
          >
            🔑 Reset mdp
          </button>
          <button
            disabled={busyId === u.id || (u.id === currentUserId && u.role === 'ADMIN')}
            onClick={() => handleToggleRole(u)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
          >
            {u.role === 'ADMIN' ? 'Rétrograder' : 'Promouvoir admin'}
          </button>
          <button
            disabled={busyId === u.id || u.id === currentUserId}
            onClick={() => handleDelete(u)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40"
          >
            Supprimer
          </button>
        </div>
      </div>
    ))}
  </div>

  {showAddModal && (
    <AddAdminModal
      onClose={() => setShowAddModal(false)}
      onCreated={(newUser) => {
        setUsers((prev) => [newUser, ...prev])
        setShowAddModal(false)
      }}
    />
  )}
</div>
  )
}

function AddAdminModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: User) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'USER'>('ADMIN')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
    let pwd = ''
    for (let i = 0; i < 14; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
    setPassword(pwd)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)
    try {
      const res = await userApi.create({ name, email, password, role })
      onCreated((res as any).data.user)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Ajouter un administrateur</h2>
        <p className="text-sm md:text-base text-slate-500 mb-6">
          Le compte sera immédiatement actif, sans vérification email.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom complet</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
            <div className="flex gap-2">
              <input
                type="text" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Au moins 8 caractères"
              />
              <button type="button" onClick={generatePassword}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 whitespace-nowrap">
                Générer
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Communiquez-le à la personne concernée par un canal sécurisé — il n'est pas ré-affiché.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Rôle</label>
            <select
              value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ADMIN">Administrateur</option>
              <option value="USER">Utilisateur simple</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 rounded-xl py-3 text-base font-medium text-slate-700 hover:bg-slate-50 transition">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-base font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
