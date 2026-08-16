'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { authApi } from '@/lib/api'

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

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
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
          {status === 'loading' && (
            <p className="text-slate-500 text-lg">Vérification en cours...</p>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
              <h2 className="text-xl font-bold text-slate-900">Email vérifié !</h2>
              <p className="text-slate-500">Vous pouvez retourner sur l'application ScholarHub.</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-3xl">⚠️</div>
              <h2 className="text-xl font-bold text-slate-900">Lien invalide</h2>
              <p className="text-slate-500">Ce lien de vérification est invalide ou a déjà été utilisé.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
