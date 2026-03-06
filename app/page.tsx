'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { setToken } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    router.prefetch('/dashboard')
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(email, password)
      const { token, user } = res.data
      if (user.role !== 'ADMIN') {
        setError('Accès refusé — compte admin requis')
        return
      }
      setToken(token)
      router.push('/dashboard')
    } catch {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
  <div className="w-full max-w-md">
    {/* Logo */}
    <div className="text-center mb-8">
      <div className="relative w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
        <span className="text-white text-3xl" aria-hidden>🎓</span>
        <img
          src="/logo.png"
          alt="ScholarHub logo"
          className="absolute inset-0 w-full h-full object-contain bg-white p-2"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <h1 className="text-3xl font-bold text-slate-900">ScholarHub Admin</h1>
      <p className="text-lg text-slate-600 mt-1">Connectez-vous à votre espace admin</p>
    </div>

    {/* Form */}
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-base">
            {error}
          </div>
        )}
        <div>
          <label className="block text-base font-medium text-slate-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="admin@scholarhub.africa"
            required
          />
        </div>
        <div>
          <label className="block text-base font-medium text-slate-700 mb-2">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  </div>
</div>
  )
}
