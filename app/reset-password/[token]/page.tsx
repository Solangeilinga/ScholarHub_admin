'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'

export default function ResetPasswordPage() {
  const params = useParams<{ token?: string }>()
  const token = params?.token
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const tokenMissing = !token || token === 'undefined'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (tokenMissing) {
      setError("Ce lien de réinitialisation est invalide ou a déjà été utilisé.")
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token as string, password)
      setSuccess(true)
      setTimeout(() => router.push('/'), 2500)
    } catch (err: any) {
      setError(err.response?.data?.error || "Ce lien est invalide ou a expiré. Demande un nouveau lien depuis l'app.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="ScholarHub" className="w-full h-full object-contain bg-white p-2"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Réinitialiser le mot de passe</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-slate-900">Mot de passe réinitialisé</h2>
              <p className="text-slate-500 mt-2">Redirection en cours...</p>
            </div>
          ) : tokenMissing ? (
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-slate-900">Lien invalide</h2>
              <p className="text-slate-500 mt-2">
                Ce lien de réinitialisation est invalide ou a déjà été utilisé. Demande un nouveau lien depuis l'app.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nouveau mot de passe</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer le mot de passe</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  )
}
