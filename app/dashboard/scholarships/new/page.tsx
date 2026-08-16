'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import COUNTRIES, { REGION_PRESETS } from '@/public/Countries'
import LEVELS from '@/public/Levels'
import FIELDS from '@/public/Fields'
import TYPES from '@/public/Types' 
import LANGUAGES from '@/public/Languages'

// Devises internationales courantes + principales devises africaines.
// "AUTRE" en dernier recours si la devise réelle n'y figure pas (l'admin
// tape alors le code ISO 4217 lui-même — jamais de conversion forcée).
const CURRENCIES = [
  'EUR', 'USD', 'GBP', 'CAD', 'CHF', 'JPY', 'CNY', 'AUD',
  'XOF', 'XAF', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'MAD', 'DZD', 'TND',
  'ETB', 'UGX', 'TZS', 'RWF', 'MUR', 'BWP', 'ZMW', 'MZN', 'AOA', 'CVE',
]

const initialForm = {
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
  typeDetails: '',
  level: [] as string[],
  countries: [] as string[],
  fields: [] as string[],
  languages: [] as string[],
  isFeatured: false,
  isActive: true,
}

// Certains champs renvoyés par l'IA n'ont pas de format strictement imposé
// (ex: "Informatique" vs "informatique", "MASTER" générique vs "MASTER_1"/
// "MASTER_2" utilisés ici) — on ne garde que ce qui correspond à une option
// réellement cliquable du formulaire, pour ne jamais avoir de case "cochée
// mais invisible".
function matchAgainstList(values: string[], list: string[]): string[] {
  return values
    .map(v => list.find(item => item.toLowerCase() === v.toLowerCase()))
    .filter((v): v is string => Boolean(v))
}

function matchLanguages(values: string[]): string[] {
  return values
    .map(v => {
      const lower = v.toLowerCase()
      const match = LANGUAGES.find(l => l.code.toLowerCase() === lower || l.name.toLowerCase() === lower)
      return match?.code
    })
    .filter((v): v is string => Boolean(v))
}

export default function NewScholarshipPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)

  const [aiMode, setAiMode] = useState<'url' | 'text'>('url')
  const [aiUrl, setAiUrl] = useState('')
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiNotice, setAiNotice] = useState<{ confidence: number; issues: string | null } | null>(null)

  const handleAiExtract = async () => {
    setAiError('')
    setAiNotice(null)

    if (aiMode === 'url' && !aiUrl.trim()) { setAiError('Colle un lien vers la page de la bourse.'); return }
    if (aiMode === 'text' && aiText.trim().length < 150) { setAiError('Colle un texte plus complet (150 caractères minimum).'); return }

    setAiLoading(true)
    try {
      const { data } = await api.post('/admin/scholarships/ai-extract', {
        url: aiMode === 'url' ? aiUrl.trim() : undefined,
        rawText: aiMode === 'text' ? aiText.trim() : undefined,
      })

      const s = data.scholarship
      setForm(prev => ({
        ...prev,
        title: s.title || prev.title,
        provider: s.provider || prev.provider,
        description: s.description || prev.description,
        requirements: s.requirements || prev.requirements,
        benefits: s.benefits || prev.benefits,
        link: s.link || prev.link,
        amount: s.amount != null ? String(s.amount) : prev.amount,
        currency: s.currency || prev.currency,
        deadline: s.deadline ? String(s.deadline).slice(0, 10) : prev.deadline,
        type: s.type || prev.type,
        typeDetails: s.typeDetails ?? prev.typeDetails,
        level: s.level?.length ? matchAgainstList(s.level, LEVELS) : prev.level,
        countries: s.countries?.length ? s.countries : prev.countries,
        fields: s.fields?.length ? matchAgainstList(s.fields, FIELDS) : prev.fields,
        languages: s.languages?.length ? matchLanguages(s.languages) : prev.languages,
      }))

      setAiNotice({ confidence: data.confidenceScore ?? 0, issues: data.issues ?? null })
    } catch (err: any) {
      setAiError(err.response?.data?.error || "Échec de l'extraction. Vérifie le lien/texte, ou remplis le formulaire manuellement.")
    } finally {
      setAiLoading(false)
    }
  }

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
      await api.post('/scholarships', {
        ...form,
        amount: form.amount ? Number(form.amount) : null,
        deadline: new Date(form.deadline).toISOString(),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        providerLogo: form.providerLogo || null,
        duration: form.duration || null,
        typeDetails: form.typeDetails || null,
        benefits: form.benefits
          ? form.benefits.split('\n').map(b => b.trim()).filter(Boolean)
          : [],
      })
      router.push('/dashboard/scholarships')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 text-sm mb-4 flex items-center gap-1">
          ← Retour
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ajouter une bourse</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Remplissez tous les champs pour créer une nouvelle bourse</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>}

        {/* Import IA */}
        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-900">✨ Importer via IA</h2>
            <p className="text-xs text-slate-500 mt-1">
              Colle un lien vers la page officielle de la bourse, ou colle directement le texte —
              l'IA pré-remplit le formulaire ci-dessous. Vérifie toujours le résultat avant de publier.
            </p>
          </div>

          <div className="flex gap-2 text-sm">
            <button type="button" onClick={() => setAiMode('url')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                aiMode === 'url' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}>🔗 Lien</button>
            <button type="button" onClick={() => setAiMode('text')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                aiMode === 'text' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}>📄 Texte collé</button>
          </div>

          {aiMode === 'url' ? (
            <input value={aiUrl} onChange={e => setAiUrl(e.target.value)}
              placeholder="https://exemple.com/bourse-xyz"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          ) : (
            <textarea rows={6} value={aiText} onChange={e => setAiText(e.target.value)}
              placeholder="Colle ici le texte complet de la bourse (conditions, montant, deadline, pays éligibles...)"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          )}

          {aiError && <p className="text-sm text-red-600">{aiError}</p>}

          {aiNotice && (
            <div className="text-sm bg-white border border-indigo-100 rounded-xl p-3 space-y-1">
              <p className="font-medium text-slate-700">
                Confiance de l'extraction : {Math.round(aiNotice.confidence * 100)}%
                {aiNotice.confidence < 0.6 && <span className="text-amber-600"> — relis bien chaque champ avant de publier</span>}
              </p>
              {aiNotice.issues && <p className="text-slate-500 text-xs">⚠️ {aiNotice.issues}</p>}
            </div>
          )}

          <button type="button" onClick={handleAiExtract} disabled={aiLoading}
            className="bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
            {aiLoading ? 'Analyse en cours...' : '✨ Pré-remplir avec l\'IA'}
          </button>
        </div>

        {/* Infos générales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">📋 Informations générales</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Ex: Bourse Erasmus+ Afrique 2024"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur *</label>
              <input required value={form.provider} onChange={e => setForm({...form, provider: e.target.value})}
                placeholder="Ex: Commission Européenne"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Logo fournisseur <span className="text-slate-400 font-normal">(URL)</span>
              </label>
              <input value={form.providerLogo} onChange={e => setForm({...form, providerLogo: e.target.value})}
                placeholder="https://exemple.com/logo.png"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea required rows={5} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Décrivez la bourse en détail : objectifs, public cible, couverture..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Conditions requises</label>
            <textarea rows={3} value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})}
              placeholder="Ex: Être ressortissant d'un pays africain, avoir moins de 35 ans..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Avantages <span className="text-slate-400 font-normal">(une ligne par avantage)</span>
            </label>
            <textarea rows={4} value={form.benefits} onChange={e => setForm({...form, benefits: e.target.value})}
              placeholder={"Frais de scolarité couverts\nBillet d'avion aller-retour\nAllocation mensuelle de 800€\nAssurance maladie"}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono" />
            <p className="text-xs text-slate-400 mt-1">Chaque ligne = un avantage affiché dans l'app</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lien de candidature *</label>
            <input required value={form.link} onChange={e => setForm({...form, link: e.target.value})}
              placeholder="https://..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Montant, dates & durée */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">💰 Montant, Dates & Durée</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Montant</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                placeholder="Ex: 10000"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Devise</label>
              <select
                value={CURRENCIES.includes(form.currency) ? form.currency : 'AUTRE'}
                onChange={e => setForm({...form, currency: e.target.value === 'AUTRE' ? '' : e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="AUTRE">Autre (préciser)</option>
              </select>
              {!CURRENCIES.includes(form.currency) && (
                <input value={form.currency} onChange={e => setForm({...form, currency: e.target.value.toUpperCase()})}
                  placeholder="Ex: XOF, GHS, KES..." maxLength={6}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-2" />
              )}
              <p className="text-xs text-slate-400 mt-1">
                Indique la devise réelle de la bourse (montant tel qu'annoncé par le bailleur) — pas de conversion approximative.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deadline *</label>
              <input required type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date de début <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Durée <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <input value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}
                placeholder="Ex: 12 mois, 2 ans..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type de bourse</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Précisions sur le type <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <input value={form.typeDetails} onChange={e => setForm({...form, typeDetails: e.target.value})}
              placeholder="Ex: Réduction de 50% sur les frais de scolarité, pas d'allocation de vie"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-xs text-slate-400 mt-1">
              Utile pour les cas qui ne collent pas exactement à une catégorie (réduction, exonération partielle, prise en charge d'une partie des frais seulement...).
            </p>
          </div>
        </div>

        {/* Niveaux */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">🎓 Niveaux Requis *</h2>
          <p className="text-xs text-slate-400 mb-4">Sélectionnez un ou plusieurs niveaux</p>
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
          <p className="text-xs text-slate-400 mb-3">{form.countries.length} pays sélectionné(s)</p>

          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-100">
            {REGION_PRESETS.map(preset => (
              <button key={preset.label} type="button"
                onClick={() => setForm({...form, countries: preset.codes})}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition">
                {preset.label}
              </button>
            ))}
          </div>

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
            {[{ key: 'isFeatured', label: '⭐ Mettre en avant (section "À la une" de l\'app)' },
              { key: 'isActive', label: '✅ Bourse active (visible dans l\'app)' }].map(opt => (
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
          <p className="font-semibold mb-2">📊 Résumé avant publication</p>
          <p>• {form.countries.length} pays sélectionné(s)</p>
          <p>• {form.level.length} niveau(x) requis</p>
          <p>• {form.fields.length} domaine(s)</p>
          <p>• {form.languages.length} langue(s)</p>
          <p>• {form.benefits ? form.benefits.split('\n').filter(Boolean).length : 0} avantage(s)</p>
          {form.duration && <p>• Durée : {form.duration}</p>}
          {form.startDate && <p>• Début : {new Date(form.startDate).toLocaleDateString('fr-FR')}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-xl py-4 font-semibold hover:bg-indigo-700 transition disabled:opacity-50 text-base">
          {loading ? 'Publication en cours...' : ' Publier la bourse'}
        </button>
      </form>
    </div>
  )
}
