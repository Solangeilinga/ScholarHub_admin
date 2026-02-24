'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import COUNTRIES from '@/public/Countries'
import LEVELS from '@/public/Levels'
import FIELDS from '@/public/Fields'
import LANGUAGES from '@/public/Languages'
import TYPES from '@/public/Types'

export default function EditScholarshipPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    provider: '',
    providerLogo: '',
    description: '',
    requirements: '',
    benefits: '',
    link: '',
    amount: '',
    currency: 'EUR',
    deadline: '',
    startDate: '',
    duration: '',
    type: 'COMPLETE',
    level: [] as string[],
    countries: [] as string[],
    fields: [] as string[],
    languages: ['fr'] as string[],
    isFeatured: false,
    isActive: true,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/scholarships/${id}`)
        const s = res.data.scholarship
        setForm({
          title: s.title || '',
          provider: s.provider || '',
          providerLogo: s.providerLogo || '',
          description: s.description || '',
          requirements: s.requirements || '',
          benefits: s.benefits?.join('\n') || '',  // tableau → textarea
          link: s.link || '',
          amount: s.amount?.toString() || '',
          currency: s.currency || 'EUR',
          deadline: s.deadline ? new Date(s.deadline).toISOString().split('T')[0] : '',
          startDate: s.startDate ? new Date(s.startDate).toISOString().split('T')[0] : '',
          duration: s.duration || '',
          type: s.type || 'COMPLETE',
          level: s.level || [],
          countries: s.countries || [],
          fields: s.fields || [],
          languages: s.languages || ['fr'],
          isFeatured: s.isFeatured || false,
          isActive: s.isActive ?? true,
        })
      } catch {
        setError('Bourse introuvable')
      } finally {
        setFetching(false)
      }
    }
    if (id) load()
  }, [id])

  const toggle = (key: 'level' | 'countries' | 'fields' | 'languages', value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.countries.length === 0) { setError('Sélectionnez au moins un pays éligible'); return }
    if (form.level.length === 0) { setError('Sélectionnez au moins un niveau d\'études'); return }

    setLoading(true)
    setError('')
    try {
      await api.put(`/scholarships/${id}`, {
        ...form,
        amount: form.amount ? Number(form.amount) : null,
        deadline: new Date(form.deadline).toISOString(),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        providerLogo: form.providerLogo || null,
        duration: form.duration || null,
        benefits: form.benefits
          ? form.benefits.split('\n').map(b => b.trim()).filter(Boolean)
          : [],
      })
      router.push('/dashboard/scholarships')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 text-sm mb-4 flex items-center gap-1">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Modifier la bourse</h1>
        <p className="text-slate-500 mt-1">Modifiez les informations de la bourse</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>}

        {/* Infos générales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">📋 Informations générales</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur *</label>
              <input required value={form.provider} onChange={e => setForm({...form, provider: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Logo fournisseur <span className="text-slate-400 font-normal">(URL)</span>
              </label>
              <input value={form.providerLogo} onChange={e => setForm({...form, providerLogo: e.target.value})}
                placeholder="https://exemple.com/logo.png"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Preview logo */}
          {form.providerLogo && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <img src={form.providerLogo} alt="logo" className="w-10 h-10 object-contain rounded-lg border border-slate-200" onError={e => (e.currentTarget.style.display = 'none')} />
              <span className="text-xs text-slate-500">Aperçu du logo</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea required rows={5} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Conditions requises</label>
            <textarea rows={3} value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Avantages <span className="text-slate-400 font-normal">(une ligne par avantage)</span>
            </label>
            <textarea rows={4} value={form.benefits} onChange={e => setForm({...form, benefits: e.target.value})}
              placeholder={"Frais de scolarité couverts\nBillet d'avion aller-retour\nAllocation mensuelle de 800€"}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono" />
            <p className="text-xs text-slate-400 mt-1">
              {form.benefits ? form.benefits.split('\n').filter(Boolean).length : 0} avantage(s) · Chaque ligne = un avantage dans l'app
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lien de candidature *</label>
            <input required value={form.link} onChange={e => setForm({...form, link: e.target.value})}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Montant, dates & durée */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">💰 Montant, Dates & Durée</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Montant</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                placeholder="Ex: 10000"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Devise</label>
              <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {['EUR', 'USD', 'GBP', 'CAD', 'XOF'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deadline *</label>
              <input required type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date de début <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Durée <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <input value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}
                placeholder="Ex: 12 mois, 2 ans..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type de bourse</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Niveaux */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">🎓 Niveaux d'études *</h2>
          <p className="text-xs text-slate-400 mb-4">{form.level.length} niveau(x) sélectionné(s)</p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(l => (
              <button key={l} type="button" onClick={() => toggle('level', l)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  form.level.includes(l) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Pays */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-slate-900">🌍 Pays éligibles *</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({...form, countries: COUNTRIES.map(c => c.code)})}
                className="text-xs text-indigo-600 hover:underline">Tout sélectionner</button>
              <span className="text-slate-300">|</span>
              <button type="button" onClick={() => setForm({...form, countries: []})}
                className="text-xs text-slate-400 hover:underline">Effacer</button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">{form.countries.length} pays sélectionné(s)</p>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map(c => (
              <button key={c.code} type="button" onClick={() => toggle('countries', c.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  form.countries.includes(c.code) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>{c.name}</button>
            ))}
          </div>
        </div>

        {/* Domaines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">📚 Domaines d'études</h2>
          <p className="text-xs text-slate-400 mb-4">{form.fields.length} domaine(s) sélectionné(s)</p>
          <div className="flex flex-wrap gap-2">
            {FIELDS.map(f => (
              <button key={f} type="button" onClick={() => toggle('fields', f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  form.fields.includes(f) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Langues */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">🗣️ Langues d'enseignement</h2>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <button key={l.code} type="button" onClick={() => toggle('languages', l.code)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  form.languages.includes(l.code) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>{l.name}</button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">⚙️ Options de publication</h2>
          <div className="space-y-3">
            {[
              { key: 'isFeatured', label: '⭐ Mettre en avant (section "À la une" de l\'app)' },
              { key: 'isActive', label: '✅ Bourse active (visible dans l\'app)' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox"
                  checked={form[opt.key as keyof typeof form] as boolean}
                  onChange={e => setForm({...form, [opt.key]: e.target.checked})}
                  className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Résumé */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800 space-y-1">
          <p className="font-semibold mb-2">📊 Résumé</p>
          <p>• {form.countries.length} pays sélectionné(s)</p>
          <p>• {form.level.length} niveau(x) d'études</p>
          <p>• {form.fields.length} domaine(s)</p>
          <p>• {form.languages.length} langue(s)</p>
          <p>• {form.benefits ? form.benefits.split('\n').filter(Boolean).length : 0} avantage(s)</p>
          {form.duration && <p>• Durée : {form.duration}</p>}
          {form.startDate && <p>• Début : {new Date(form.startDate).toLocaleDateString('fr-FR')}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-xl py-4 font-semibold hover:bg-indigo-700 transition disabled:opacity-50 text-base">
          {loading ? 'Sauvegarde...' : '💾 Sauvegarder les modifications'}
        </button>
      </form>
    </div>
  )
}