import axios from 'axios'

const API_URL ="https://scholarhubbackend-production.up.railway.app/api"

const api = axios.create({ baseURL: API_URL })

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
}

export const scholarshipApi = {
  getAll: (params?: object) => api.get('/scholarships', { params }),
  getOne: (id: string) => api.get(`/scholarships/${id}`),
  create: (data: object) => api.post('/scholarships', data),           // /admin/ → /
  update: (id: string, data: object) => api.put(`/scholarships/${id}`, data),   // /admin/ → /
  delete: (id: string) => api.delete(`/scholarships/${id}`),           // /admin/ → /
  getStats: () => api.get('/scholarships/stats'),
  getAllAdmin: (params?: any) => api.get('/scholarships/admin/all', { params }),
}

export const userApi = {
  getAll: () => api.get('/admin/users'),
  updateRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
}

export const supportApi = {
  getAll: (status?: string) => api.get('/support', { params: status ? { status } : {} }),
  reply: (id: string, reply: string) => api.post(`/support/${id}/reply`, { reply }),
  close: (id: string) => api.patch(`/support/${id}/close`),
}

export default api