'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  // useParams() est la façon fiable de lire un segment dynamique côté
  // client dans l'App Router — évite tout risque de recevoir "undefined"
  // si jamais le composant se rend avant que les params serveur arrivent.
  const params = useParams<{ token?: string }>()
  const token = params?.token
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!token || token === 'undefined') {
      setStatus('error')
      return
    }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="ScholarHub" className="w-full h-full object-contain bg-white p-2"
            onError={(e) => { e.currentTarget.style.display = 'none' }} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-6">ScholarHub</h1>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          {status === 'loading' && (
            <>
              <div className="text-5xl mb-4">⏳</div>
              <h2 className="text-xl font-bold text-slate-900">Vérification en cours...</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-slate-900">Email vérifié !</h2>
              <p className="text-slate-500 mt-2">
                Ton adresse email a bien été confirmée. Tu peux maintenant retourner sur l'app ScholarHub et te connecter.
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-slate-900">Lien invalide</h2>
              <p className="text-slate-500 mt-2">
                Ce lien de vérification est invalide, a déjà été utilisé, ou a expiré. Essaie de te reconnecter à l'app pour recevoir un nouveau lien.
              </p>
            </>
          )}
        </div>

        <Link href="/" className="inline-block mt-6 text-sm text-indigo-600 hover:underline">
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
