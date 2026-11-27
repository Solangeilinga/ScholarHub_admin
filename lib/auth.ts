export const getToken = () => {
  if (typeof window === 'undefined') return null
  const token = sessionStorage.getItem('admin_token')
  if (token) return token
  const legacy = localStorage.getItem('admin_token')
  if (legacy) {
    sessionStorage.setItem('admin_token', legacy)
    localStorage.removeItem('admin_token')
  }
  return legacy
}

export const setToken = (token: string) => {
  sessionStorage.setItem('admin_token', token)
  localStorage.removeItem('admin_token')
}

export const removeToken = () => {
  sessionStorage.removeItem('admin_token')
  sessionStorage.removeItem('admin_user_id')
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user_id')
}

export const isAuthenticated = () => !!getToken()

export const setCurrentUserId = (id: string) => {
  sessionStorage.setItem('admin_user_id', id)
  localStorage.removeItem('admin_user_id')
}

export const getCurrentUserId = () => {
  if (typeof window === 'undefined') return null
  const current = sessionStorage.getItem('admin_user_id')
  if (current) return current
  const legacy = localStorage.getItem('admin_user_id')
  if (legacy) {
    sessionStorage.setItem('admin_user_id', legacy)
    localStorage.removeItem('admin_user_id')
  }
  return legacy
}
