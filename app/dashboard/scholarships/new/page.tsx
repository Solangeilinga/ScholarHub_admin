'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { scholarshipApi } from '@/lib/api'

const COUNTRIES = ['BF', 'CI', 'SN', 'ML', 'GN', 'TG', 'BJ', 'NE', 'CM', 'CD', 'MG', 'MZ', 'TZ', 'KE', 'GH', 'NG', 'ET', 'ZA', 'MA', 'TN', 'DZ', 'EG']
const FIELDS = ['Informatique', 'Médecine', 'Droit', 'Économie', 'Ingénierie', 'Sciences', 'Agriculture', 'Architecture', 'Éducation', 'Arts']
const LEVELS = ['LICENCE', 'MASTER', 'DOCTORAT', 'POSTDOC', 'PROFESSIONNEL']
const TYPES = ['COMPLETE', 'PARTIELLE', 'RECHERCHE', 'ECHANGE', 'FORMATION']
const LANGUAGES = ['fr', 'en', 'pt', 'ar']

export default function NewScholarshipPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
 const [form, setForm] = useState({
    title: '',
    provider: '',
    description: '',
    requirements: '',
    link: '',
    amount: '',
    currency: 'USD',
    deadline: '',
    type: 'COMPLETE',  // ← était 'FULL'
    level: [] as string[],
    countries: [] as string[],
    fields: [] as string[],
    languages: ['fr'],
    isFeatured: false,
    isActive: true,
  })

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
    setLoading(true)
    setError('')
    try {
      await scholarshipApi.create({
        ...form,
        amount: form.amount ? Number(form.amount) : null,
        deadline: new Date(form.deadline).toISOString(),
      })
      router.push('/dashboard/scholarships')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 text-sm mb-4 flex items-center gap-1">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Ajouter une bourse</h1>
        <p className="text-slate-500 mt-1">Remplissez les informations de la nouvelle bourse</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>
        )}

        {/* Infos de base */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Informations générales</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Bourse Eiffel Excellence"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur *</label>
            <input
              required
              value={form.provider}
              onChange={e => setForm({...form, provider: e.target.value})}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Campus France"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Description complète de la bourse..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Conditions requises</label>
            <textarea
              rows={3}
              value={form.requirements}
              onChange={e => setForm({...form, requirements: e.target.value})}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Conditions d'éligibilité..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lien de candidature *</label>
            <input
              required
              type="url"
              value={form.link}
              onChange={e => setForm({...form, link: e.target.value})}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Montant & Deadline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Montant & Deadline</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Montant</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: 10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Devise</label>
              <select
                value={form.currency}
                onChange={e => setForm({...form, currency: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['USD', 'EUR', 'GBP', 'CAD', 'XOF'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deadline *</label>
              <input
                required
                type="date"
                value={form.deadline}
                onChange={e => setForm({...form, deadline: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Niveaux */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Niveaux d'études</h2>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(l => (
              <button
                key={l} type="button"
                onClick={() => toggle('level', l)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  form.level.includes(l)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Pays */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Pays éligibles</h2>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map(c => (
              <button
                key={c} type="button"
                onClick={() => toggle('countries', c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  form.countries.includes(c)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Domaines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Domaines</h2>
          <div className="flex flex-wrap gap-2">
            {FIELDS.map(f => (
              <button
                key={f} type="button"
                onClick={() => toggle('fields', f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  form.fields.includes(f)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >{f}</button>
            ))}
          </div>
        </div>

        {/* Langues */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Langues</h2>
          <div className="flex gap-2">
            {LANGUAGES.map(l => (
              <button
                key={l} type="button"
                onClick={() => toggle('languages', l)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  form.languages.includes(l)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >{l.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Options</h2>
          <div className="space-y-3">
            {[
              { key: 'isFeatured', label: '⭐ Mettre en avant (À la une)' },
              { key: 'isActive', label: '✅ Bourse active' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[opt.key as keyof typeof form] as boolean}
                  onChange={e => setForm({...form, [opt.key]: e.target.checked})}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-xl py-4 font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'Publication en cours...' : '🚀 Publier la bourse'}
        </button>
      </form>
    </div>
  )
}