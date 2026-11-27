'use client'

import { useCallback, useEffect, useState } from 'react'
import { scraperApi } from '@/lib/api'

type Scholarship = {
  id: string
  title: string
  provider: string
  confidenceScore?: number | null
  source?: string | null
  scrapedAt?: string | null
  extractionNotes?: string | null
}

type ScraperStats = {
  pending: number
  approved: number
  rejected: number
  total: number
  avgConfidence: number | null
  automation?: {
    aiExtractionReady: boolean
    webDiscoveryReady: boolean
    discoveryProvider: string
    activeSources: string[]
    maxCandidatesPerRun: number
    schedule: string
  }
}

export default function ScraperPage() {
  const [stats, setStats] = useState<ScraperStats | null>(null)
  const [pending, setPending] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    try {
      const [statsResponse, pendingResponse] = await Promise.all([
        scraperApi.getStats(),
        scraperApi.getPending(),
      ])
      setStats(statsResponse.data?.stats || null)
      setPending(pendingResponse.data?.scholarships || [])
    } catch (error) {
      console.error('Erreur de chargement du scraper', error)
      setMessage('Impossible de récupérer les informations du scraper. Vérifie la connexion au serveur.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 30000)
    return () => window.clearInterval(interval)
  }, [load])

  const run = async () => {
    setRunning(true)
    setMessage('')
    try {
      const response = await scraperApi.run()
      setMessage(response.data?.message || 'La collecte a été demandée. Les résultats apparaîtront ici après traitement.')
      window.setTimeout(load, 5000)
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Le lancement du scraper a échoué.')
    } finally {
      setRunning(false)
    }
  }

  const moderate = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id)
    try {
      if (action === 'approve') await scraperApi.approve(id)
      else await scraperApi.reject(id)
      setMessage(action === 'approve' ? 'Bourse approuvée et publiée.' : 'Bourse rejetée.')
      await load()
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'La modification a échoué.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" /></div>
  }

  const automation = stats?.automation
  const readiness = [
    { label: 'Extraction par IA', ready: Boolean(automation?.aiExtractionReady), detail: 'Groq ou Gemini' },
    { label: 'Découverte Web', ready: Boolean(automation?.webDiscoveryReady), detail: automation?.discoveryProvider || 'Aucun moteur configuré' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Automatisation des bourses</h1>
          <p className="mt-2 text-slate-500">Suivi de la collecte, de l’analyse IA et de la validation des offres.</p>
        </div>
        <button onClick={run} disabled={running} className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          {running ? 'Lancement…' : '↻ Lancer une collecte'}
        </button>
      </div>

      {message && <div role="status" className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">{message}</div>}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Offres collectées', value: stats?.total ?? 0 },
          { label: 'Publiées', value: stats?.approved ?? 0 },
          { label: 'À vérifier', value: stats?.pending ?? 0 },
          { label: 'Rejetées', value: stats?.rejected ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-3xl font-bold text-slate-900">{item.value}</p>
            <p className="mt-1 text-sm text-slate-500">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <h2 className="font-semibold text-slate-900">État de l’automatisation</h2>
        <p className="mt-1 text-sm text-slate-500">Le système actualise ces informations automatiquement toutes les 30 secondes.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {readiness.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
              <div>
                <p className="font-medium text-slate-800">{item.label}</p>
                <p className="text-sm text-slate-500">{item.detail}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.ready ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {item.ready ? 'Configuré' : 'À configurer'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
          <p><strong>Planification :</strong> {automation?.schedule || 'Tous les jours à 03:00 (Africa/Abidjan)'}</p>
          <p><strong>Sources intégrées :</strong> {automation?.activeSources?.length ?? 0}</p>
          <p><strong>Limite par collecte :</strong> {automation?.maxCandidatesPerRun ?? 150} pages</p>
        </div>
        {automation?.activeSources?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {automation.activeSources.map((source) => <span key={source} className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600">{source}</span>)}
          </div>
        ) : null}
        {(!automation?.aiExtractionReady || !automation?.webDiscoveryReady) && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Certaines étapes sont désactivées. L’extraction IA nécessite GROQ_API_KEY ou GEMINI_API_KEY. La découverte Web nécessite BRAVE_SEARCH_API_KEY (ou les identifiants Google CSE temporaires).
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Offres en attente de vérification</h2>
            <p className="mt-1 text-sm text-slate-500">Les offres incertaines ne sont pas publiées automatiquement.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Aucune offre en attente.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.map((scholarship) => (
              <article key={scholarship.id} className="py-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">{scholarship.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{scholarship.provider} · {scholarship.source || 'Source inconnue'}</p>
                    <p className="mt-1 text-xs text-slate-500">Confiance : {typeof scholarship.confidenceScore === 'number' ? `${Math.round(scholarship.confidenceScore * 100)} %` : 'Non évaluée'}</p>
                    {scholarship.extractionNotes && <p className="mt-2 text-sm text-amber-700">{scholarship.extractionNotes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => moderate(scholarship.id, 'approve')} disabled={busyId === scholarship.id} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">Approuver</button>
                    <button onClick={() => moderate(scholarship.id, 'reject')} disabled={busyId === scholarship.id} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">Rejeter</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
