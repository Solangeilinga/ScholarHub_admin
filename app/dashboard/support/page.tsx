'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const PAGE_SIZE = 20

type FilterKey = 'all' | TicketStatus
type TicketCacheEntry = {
  tickets: Ticket[]
  page: number
  hasMore: boolean
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')
  const cacheRef = useRef<Partial<Record<FilterKey, TicketCacheEntry>>>({})
  const hasLoadedStatsRef = useRef(false)
  const requestIdsRef = useRef<Record<FilterKey, number>>({
    all: 0,
    OPEN: 0,
    ANSWERED: 0,
    CLOSED: 0,
  })

  const refreshTickets = useCallback(async (
    targetFilter: FilterKey,
    options?: { showLoader?: boolean; append?: boolean; includeStats?: boolean }
  ) => {
    const showLoader = options?.showLoader ?? false
    const append = options?.append ?? false
    const includeStats = options?.includeStats ?? !hasLoadedStatsRef.current
    const cachedEntry = cacheRef.current[targetFilter]
    const targetPage = append ? (cachedEntry?.page ?? 0) + 1 : 1
    const requestId = (requestIdsRef.current[targetFilter] ?? 0) + 1
    requestIdsRef.current[targetFilter] = requestId
    const isLatestForFilter = () =>
      requestIdsRef.current[targetFilter] === requestId
    if (showLoader) {
      setLoading(true)
    } else if (append) {
      setLoadingMore(true)
    }

    try {
      const res = await supportApi.getAll({
        status: targetFilter === 'all' ? undefined : targetFilter,
        includeStats,
        page: targetPage,
        limit: PAGE_SIZE,
      })
      const pageTickets = ((res as any).data.tickets ?? []) as Ticket[]
      const mergedTickets = append && cachedEntry
        ? [...cachedEntry.tickets, ...pageTickets]
        : pageTickets
      const nextHasMore = Boolean((res as any).data?.pagination?.hasMore)
      cacheRef.current[targetFilter] = {
        tickets: mergedTickets,
        page: targetPage,
        hasMore: nextHasMore,
      }

      if ((res as any) .data.stats) {
        setStats((res as any).data.stats)
        hasLoadedStatsRef.current = true
      }

      if (isLatestForFilter() && filter === targetFilter) {
        setTickets(mergedTickets)
        setHasMore(nextHasMore)
      }
    } finally {
      if (isLatestForFilter() && filter === targetFilter) {
        if (showLoader) setLoading(false)
        if (append) setLoadingMore(false)
      }
    }
  }, [filter])

  useEffect(() => {
    const cached = cacheRef.current[filter]
    if (cached?.tickets) {
      setTickets(cached.tickets)
      setHasMore(cached.hasMore)
      setLoading(false)
    } else {
      void refreshTickets(filter, { showLoader: true })
    }
  }, [filter, refreshTickets])

  useEffect(() => {
    if (filter !== 'all') return
    ;(['OPEN', 'ANSWERED', 'CLOSED'] as const).forEach((status) => {
      if (!cacheRef.current[status]) {
        void refreshTickets(status, { showLoader: false, includeStats: false })
      }
    })
  }, [filter, refreshTickets])

  const handleSelectTicket = useCallback((ticket: Ticket) => {
    setSelected(ticket)
    setReply('')
    setMobileView('detail')
  }, [])

  const handleReply = useCallback(async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await supportApi.reply(selected.id, reply)
      setReply('')
      setSelected(prev => prev ? { ...prev, status: 'ANSWERED', reply } : null)
      cacheRef.current = {}
      await refreshTickets(filter, { includeStats: true })
    } finally { setSending(false) }
  }, [filter, refreshTickets, reply, selected])

  const handleClose = useCallback(async (id: string) => {
    await supportApi.close(id)
    setSelected(null)
    cacheRef.current = {}
    await refreshTickets(filter, { includeStats: true })
  }, [filter, refreshTickets])

  const handleLoadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return
    await refreshTickets(filter, { append: true })
  }, [filter, hasMore, loading, loadingMore, refreshTickets])

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

  const mobileTicketsContent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      )
    }
    if (tickets.length === 0) {
      return <div className="text-center text-slate-600 py-8 text-sm md:text-base">Aucune demande</div>
    }
    return (
      <>
        {tickets.map(ticket => (
          <div key={ticket.id} onClick={() => handleSelectTicket(ticket)}
            className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-indigo-300 transition active:bg-indigo-50 flex flex-col sm:flex-row justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm md:text-base font-bold shrink-0">{ticket.user.name[0]}</div>
              <div className="min-w-0">
                <p className="text-sm md:text-base font-semibold text-slate-900 truncate">{ticket.user.name}</p>
                <p className="text-xs md:text-sm text-slate-700">{ticket.user.country}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs md:text-sm font-medium shrink-0 ${statusColor(ticket.status)}`}>{ticket.status === 'OPEN' ? 'Nouveau' : ticket.status === 'ANSWERED' ? 'Répondu' : 'Fermé'}</span>
            <p className="text-xs md:text-sm text-slate-600 mt-1">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        ))}
        {hasMore && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingMore ? 'Chargement...' : 'Charger plus'}
          </button>
        )}
      </>
    )
  }, [handleLoadMore, handleSelectTicket, hasMore, loading, loadingMore, tickets])

  const desktopTicketsContent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      )
    }
    if (tickets.length === 0) {
      return <div className="text-center text-slate-600 py-8 text-sm md:text-base">Aucune demande</div>
    }
    return (
      <>
        {tickets.map(ticket => (
          <div key={ticket.id} onClick={() => handleSelectTicket(ticket)}
            className={`bg-white rounded-xl border p-4 cursor-pointer transition ${selected?.id === ticket.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm md:text-base font-bold">{ticket.user.name[0]}</div>
                <div>
                  <p className="text-sm md:text-base font-semibold text-slate-900">{ticket.user.name}</p>
                  <p className="text-xs md:text-sm text-slate-700">{ticket.user.country}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs md:text-sm font-medium ${statusColor(ticket.status)}`}>{ticket.status === 'OPEN' ? 'Nouveau' : ticket.status === 'ANSWERED' ? 'Répondu' : 'Fermé'}</span>
            </div>
            <p className="text-xs md:text-sm font-medium text-slate-700 truncate">{ticket.subject}</p>
            <p className="text-xs md:text-sm text-slate-700 mt-1 line-clamp-2">{ticket.message}</p>
            <p className="text-xs md:text-sm text-slate-600 mt-2">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        ))}
        {hasMore && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingMore ? 'Chargement...' : 'Charger plus'}
          </button>
        )}
      </>
    )
  }, [handleLoadMore, handleSelectTicket, hasMore, loading, loadingMore, selected?.id, tickets])

  const detailPanelContent = useMemo(() => (
    selected ? (
      <div className="flex flex-col h-full min-h-0">
        <div className="md:hidden flex items-center gap-2 p-4 border-b border-slate-200 flex-shrink-0">
          <button onClick={() => setMobileView('list')} className="flex items-center gap-1 text-indigo-600 text-sm font-medium">← Retour à la liste</button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 p-4 md:p-6">
          {/* Header ticket */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">{selected.user.name[0]}</div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{selected.user.name}</p>
                <p className="text-xs md:text-sm text-slate-700 truncate">{selected.user.email} · {selected.user.country}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center justify-end">
              <span className={`px-3 py-1.5 rounded-full text-sm md:text-base font-medium ${statusColor(selected.status)}`}>{statusLabel(selected.status)}</span>
              {selected.status !== 'CLOSED' && (
                <button onClick={() => handleClose(selected.id)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition">🔒 Fermer</button>
              )}
            </div>
          </div>

          {/* Message étudiant */}
          <div className="bg-slate-50 rounded-xl p-4 mb-3">
            <p className="text-sm md:text-base font-semibold text-slate-700 mb-2">📋 {selected.subject}</p>
            <p className="text-sm md:text-base text-slate-800 leading-relaxed">{selected.message}</p>
          </div>

          {/* Réponse existante */}
          {selected.reply && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100 mb-3">
              <p className="text-sm md:text-base font-semibold text-green-700 mb-2">✅ Votre réponse</p>
              <p className="text-sm md:text-base text-slate-800 leading-relaxed">{selected.reply}</p>
            </div>
          )}

          {/* Zone réponse */}
          {selected.status !== 'CLOSED' ? (
            <div className="flex flex-col gap-3">
              <label className="block text-sm md:text-base font-medium text-slate-800">Répondre à l&apos;étudiant</label>
              <textarea rows={5} value={reply} onChange={e => setReply(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Rédigez votre réponse... Elle sera envoyée par email à l&apos;étudiant." />
              <div className="flex gap-3 flex-wrap">
                <button onClick={handleReply} disabled={!reply.trim() || sending}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm md:text-base font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                  {sending ? 'Envoi...' : '📨 Envoyer par email'}
                </button>
                <button onClick={() => setReply('')}
                  className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-sm md:text-base font-semibold hover:bg-slate-200 transition">
                  Effacer
                </button>
              </div>
              <p className="text-xs md:text-sm text-slate-600 mt-1">✉️ L&apos;étudiant recevra un email + une notification dans l&apos;app</p>
            </div>
          ) : (
            <div className="flex items-center justify-center p-12 text-slate-600">
              <div className="text-center">
                <p className="text-4xl mb-2">🔒</p>
                <p className="text-sm md:text-base font-medium">Ticket fermé</p>
              </div>
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="flex-1 flex items-center justify-center text-slate-600 min-h-0">
        <div className="text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium text-base md:text-lg">Sélectionnez une demande</p>
          <p className="text-sm md:text-base mt-1">pour voir les détails et répondre</p>
        </div>
      </div>
    )
  ), [handleClose, handleReply, reply, selected, sending])

  return (
    <div className="flex flex-col h-full md:h-screen">
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Demandes d&apos;assistance</h1>
        <p className="text-slate-700 mt-1 text-sm md:text-base">Aidez les étudiants dans leurs candidatures</p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
          {[{ label: 'Total', value: stats.total, color: 'bg-slate-50' },
            { label: 'En attente', value: stats.open, color: 'bg-amber-50' },
            { label: 'Répondus', value: stats.answered, color: 'bg-green-50' }].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl border border-slate-200 p-3 md:p-4`}>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs md:text-sm text-slate-700">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* MOBILE */}
      <div className="md:hidden flex-1 flex flex-col min-h-0">
        {mobileView === 'list' ? (
          <div className="flex flex-col flex-1 min-h-0 gap-3">
            <div className="flex gap-2 flex-wrap flex-shrink-0">
              {(['all', 'OPEN', 'ANSWERED', 'CLOSED'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
                    filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                  }`}>
                  {f === 'all' ? 'Tous' : f === 'OPEN' ? 'En attente' : f === 'ANSWERED' ? 'Répondus' : 'Fermés'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {mobileTicketsContent}
            </div>
          </div>
        ) : detailPanelContent}
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex gap-6 flex-1 min-h-0">
        <div className="w-80 flex flex-col min-h-0 gap-3">
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            {(['all', 'OPEN', 'ANSWERED', 'CLOSED'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
                  filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}>
                {f === 'all' ? 'Tous' : f === 'OPEN' ? 'En attente' : f === 'ANSWERED' ? 'Répondus' : 'Fermés'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {desktopTicketsContent}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col min-h-0 overflow-hidden">
          {detailPanelContent}
        </div>
      </div>
    </div>
  )
}
