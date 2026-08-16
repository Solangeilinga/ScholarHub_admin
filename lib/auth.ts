export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null

export const setToken = (token: string) =>
  localStorage.setItem('admin_token', token)

export const removeToken = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user_id')
}

export const isAuthenticated = () => !!getToken()

// ← Identifiant de l'admin connecté, utilisé pour désactiver les actions
// dangereuses sur son propre compte (auto-suppression, auto-rétrogradation)
export const setCurrentUserId = (id: string) =>
  localStorage.setItem('admin_user_id', id)

export const getCurrentUserId = () =>
  typeof window !== 'undefined' ? localStorage.getItem('admin_user_id') : null
