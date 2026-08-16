import axios from 'axios'

const API_URL = "https://scholarhub-backend-n8de.onrender.com/api"
const GET_CACHE_TTL_MS = 30000

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // ← 30s pour laisser le temps à Render de se réveiller
})

type CacheEntry = {
  expiresAt: number
  response: unknown
}

const getCache = new Map<string, CacheEntry>()
const inflightGet = new Map<string, Promise<unknown>>()

function serializeParams(params?: Record<string, unknown>) {
  if (!params) return ''
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join('|')
}

function buildGetCacheKey(url: string, params?: Record<string, unknown>) {
  return `${url}?${serializeParams(params)}`
}

function invalidateGetCache(prefixes?: string[]) {
  if (!prefixes || prefixes.length === 0) {
    getCache.clear()
    inflightGet.clear()
    return
  }
  for (const key of getCache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      getCache.delete(key)
      inflightGet.delete(key)
    }
  }
}

async function cachedGet<T>(
  url: string,
  params?: Record<string, unknown>,
  ttlMs = GET_CACHE_TTL_MS
) {
  const key = buildGetCacheKey(url, params)
  const now = Date.now()
  const cached = getCache.get(key)

  if (cached && cached.expiresAt > now) {
    return cached.response as T
  }

  const pending = inflightGet.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  const request = api.get(url, { params }).then((response) => {
    getCache.set(key, { expiresAt: Date.now() + ttlMs, response })
    return response
  }).finally(() => {
    inflightGet.delete(key)
  })

  inflightGet.set(key, request)
  return request as Promise<T>
}

// ← Wake-up Render au chargement de l'admin
if (typeof window !== 'undefined') {
  axios.get(`${API_URL.replace('/api', '')}/health`, { timeout: 30000 }).catch(() => {})
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email/${token}`),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
}

export const scholarshipApi = {
  getAll: (params?: Record<string, unknown>) => cachedGet('/scholarships', params),
  getOne: (id: string) => cachedGet(`/scholarships/${id}`),
  create: async (data: object) => {
    const res = await api.post('/scholarships', data)
    invalidateGetCache(['/scholarships'])
    return res
  },
  update: async (id: string, data: object) => {
    const res = await api.put(`/scholarships/${id}`, data)
    invalidateGetCache(['/scholarships'])
    return res
  },
  delete: async (id: string) => {
    const res = await api.delete(`/scholarships/${id}`)
    invalidateGetCache(['/scholarships'])
    return res
  },
  getStats: () => cachedGet('/scholarships/stats'),
  getAllAdmin: (params?: Record<string, unknown>) =>
    cachedGet('/scholarships/admin/all', params),
}

export const userApi = {
  getAll: () => cachedGet('/admin/users'),
  create: async (data: { name: string; email: string; password: string; role: 'USER' | 'ADMIN' }) => {
    const res = await api.post('/admin/users', data)
    invalidateGetCache(['/admin/users'])
    return res
  },
  updateRole: async (id: string, role: string) => {
    const res = await api.patch(`/admin/users/${id}/role`, { role })
    invalidateGetCache(['/admin/users'])
    return res
  },
  delete: async (id: string) => {
    const res = await api.delete(`/admin/users/${id}`)
    invalidateGetCache(['/admin/users'])
    return res
  },
}

export const supportApi = {
  getAll: (params?: {
    status?: string
    includeStats?: boolean
    page?: number
    limit?: number
  }) =>
    cachedGet('/support', {
      ...(params?.status ? { status: params.status } : {}),
      includeStats: params?.includeStats === false ? '0' : '1',
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    }),
  reply: async (id: string, reply: string) => {
    const res = await api.post(`/support/${id}/reply`, { reply })
    invalidateGetCache(['/support'])
    return res
  },
  close: async (id: string) => {
    const res = await api.patch(`/support/${id}/close`)
    invalidateGetCache(['/support'])
    return res
  },
}

// ← API scraper
export const scraperApi = {
  getPending: () => api.get('/admin/scraper/pending'),
  getStats: () => api.get('/admin/scraper/stats'),
  run: () => api.post('/admin/scraper/run'),
  approve: (id: string) => api.patch(`/admin/scraper/${id}/approve`),
  reject: (id: string) => api.patch(`/admin/scraper/${id}/reject`),
  approveAll: (ids: string[]) => api.post('/admin/scraper/approve-all', { ids }),
}

export default api