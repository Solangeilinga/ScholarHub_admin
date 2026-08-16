'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'Ce lien est invalide ou a expiré. Refaites une demande depuis l\'application.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <span className="text-white text-3xl" aria-hidden>🎓</span>
            <img
              src="/logo.png"
              alt="ScholarHub logo"
              className="absolute inset-0 w-full h-full object-contain bg-white p-2"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">ScholarHub</h1>
          <p className="text-lg text-slate-600 mt-1">Réinitialisation du mot de passe</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
              <h2 className="text-xl font-bold text-slate-900">Mot de passe changé !</h2>
              <p className="text-slate-500">
                Vous pouvez maintenant retourner sur l'application ScholarHub et vous connecter avec votre nouveau mot de passe.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-base">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-base font-medium text-slate-700 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Au moins 8 caractères"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-slate-700 mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-xl py-4 text-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Changer le mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
