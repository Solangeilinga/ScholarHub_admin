'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { isAuthenticated, removeToken, setCurrentUserId, setToken } from '@/lib/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) router.replace('/dashboard')
  }, [router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login(email.trim(), password)
      const user = response.data?.user
      const token = response.data?.token

      if (!user || user.role !== 'ADMIN' || typeof token !== 'string') {
        removeToken()
        setError("Ce compte n'a pas les droits nécessaires pour accéder au panneau d'administration.")
        return
      }

      setToken(token)
      setCurrentUserId(user.id)
      router.replace('/dashboard')
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error ||
        'Connexion impossible. Vérifiez vos identifiants ou réessayez plus tard.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-3xl text-white">
            🎓
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ScholarHub Admin</h1>
          <p className="mt-2 text-sm text-slate-500">Connectez-vous avec votre compte administrateur.</p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-slate-700">Adresse email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin@exemple.com"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Votre mot de passe"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Accès réservé aux administrateurs autorisés.
        </p>
      </section>
    </main>
  )
}
