'use client'
import { useEffect, useState } from 'react'
import { supportApi } from '@/lib/api'

type TicketStatus = 'OPEN' | 'ANSWERED' | 'CLOSED'

interface Ticket {
  id: string
  subject: string
  message: string
  reply?: string
  status: TicketStatus
  createdAt: string
  user: { name: string; email: string; country: string }
}

interface Stats {
  total: number
  open: number
  answered: number
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [filter, setFilter] = useState<'all' | TicketStatus>('all')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try {
      const res = await supportApi.getAll(filter === 'all' ? undefined : filter)
      setTickets(res.data.tickets)
      setStats(res.data.stats)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await supportApi.reply(selected.id, reply)
      setReply('')
      setSelected(prev => prev ? { ...prev, status: 'ANSWERED', reply } : null)
      load()
    } catch {
      alert('Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  const handleClose = async (id: string) => {
    await supportApi.close(id)
    setSelected(null)
    load()
  }

  const statusColor = (s: TicketStatus) => ({
    OPEN: 'bg-amber-100 text-amber-700',
    ANSWERED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-slate-100 text-slate-500',
  }[s])

  const statusLabel = (s: TicketStatus) => ({
    OPEN: '⏳ En attente',
    ANSWERED: '✅ Répondu',
    CLOSED: '🔒 Fermé',
  }[s])

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header fixe */}
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Demandes d'assistance</h1>
        <p className="text-slate-500 mt-1">Aidez les étudiants dans leurs candidatures</p>
      </div>

      {/* Stats fixe */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-4 flex-shrink-0">
          {[
            { label: 'Total', value: stats.total, color: 'bg-slate-50' },
            { label: 'En attente', value: stats.open, color: 'bg-amber-50' },
            { label: 'Répondus', value: stats.answered, color: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl border border-slate-200 p-4`}>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Contenu principal — prend tout l'espace restant */}
      <div className="flex gap-6 flex-1 min-h-0">

        {/* Liste tickets — scrollable */}
        <div className="w-80 flex flex-col min-h-0 gap-3">
          {/* Filtres */}
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            {(['all', 'OPEN', 'ANSWERED', 'CLOSED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'OPEN' ? 'En attente' : f === 'ANSWERED' ? 'Répondus' : 'Fermés'}
              </button>
            ))}
          </div>

          {/* Liste scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center text-slate-400 py-8 text-sm">Aucune demande</div>
            ) : tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => { setSelected(ticket); setReply('') }}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition ${
                  selected?.id === ticket.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {ticket.user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{ticket.user.name}</p>
                      <p className="text-xs text-slate-500">{ticket.user.country}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(ticket.status)}`}>
                    {ticket.status === 'OPEN' ? 'Nouveau' : ticket.status === 'ANSWERED' ? 'Répondu' : 'Fermé'}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-700 truncate">{ticket.subject}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ticket.message}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Détail ticket — scrollable */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col min-h-0 overflow-hidden">
          {selected ? (
            <>
              {/* Header scrollable */}
              <div className="overflow-y-auto flex-1 min-h-0">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {selected.user.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{selected.user.name}</p>
                        <p className="text-sm text-slate-500">{selected.user.email} · {selected.user.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(selected.status)}`}>
                        {statusLabel(selected.status)}
                      </span>
                      {selected.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleClose(selected.id)}
                          className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition"
                        >
                          🔒 Fermer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message étudiant */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">📋 {selected.subject}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{selected.message}</p>
                  </div>

                  {/* Réponse existante */}
                  {selected.reply && (
                    <div className="bg-green-50 rounded-xl p-4 mt-3 border border-green-100">
                      <p className="text-sm font-semibold text-green-700 mb-2">✅ Votre réponse</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{selected.reply}</p>
                    </div>
                  )}
                </div>

                {/* Zone de réponse */}
                {selected.status !== 'CLOSED' && (
                  <div className="p-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {selected.reply ? 'Mettre à jour la réponse' : 'Répondre à l\'étudiant'}
                    </label>
                    <textarea
                      rows={5}
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Rédigez votre réponse... Elle sera envoyée par email à l'étudiant."
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleReply}
                        disabled={!reply.trim() || sending}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {sending ? 'Envoi...' : '📨 Envoyer par email'}
                      </button>
                      <button
                        onClick={() => setReply('')}
                        className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-200 transition"
                      >
                        Effacer
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      ✉️ L'étudiant recevra un email + une notification dans l'app
                    </p>
                  </div>
                )}

                {selected.status === 'CLOSED' && (
                  <div className="flex items-center justify-center p-12 text-slate-400">
                    <div className="text-center">
                      <p className="text-3xl mb-2">🔒</p>
                      <p className="text-sm font-medium">Ticket fermé</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="font-medium">Sélectionnez une demande</p>
                <p className="text-sm mt-1">pour voir les détails et répondre</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}