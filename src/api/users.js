import { apiClient } from './client'

/** GET /api/users -> { items, total, page, limit, totalPages } */
export function searchUsers({ email, etablissementId, roleId, actif, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams()
  if (email) params.set('email', email)
  if (etablissementId) params.set('etablissementId', etablissementId)
  if (roleId) params.set('roleId', roleId)
  if (actif !== undefined && actif !== null) params.set('actif', actif)
  params.set('page', page)
  params.set('limit', limit)
  return apiClient.get(`/users?${params.toString()}`)
}

export function getUser(id) {
  return apiClient.get(`/users/${id}`)
}

/** POST /api/users -> crée le compte + assigne le rôle + lie/crée le dossier métier */
export function createUser(data) {
  return apiClient.post('/users', data)
}

export function updateUser(id, data) {
  return apiClient.patch(`/users/${id}`, data)
}

export function activateUser(id) {
  return apiClient.patch(`/users/${id}/activate`)
}

export function deactivateUser(id) {
  return apiClient.patch(`/users/${id}/deactivate`)
}

export function resetUserPassword(id, nouveauMotDePasse) {
  return apiClient.post(`/users/${id}/reset-password`, { nouveauMotDePasse })
}

/** DELETE /api/users/{id} -> suppression logique (récupérable via /restore) */
export function deleteUser(id) {
  return apiClient.delete(`/users/${id}`)
}

export function restoreUser(id) {
  return apiClient.post(`/users/${id}/restore`)
}
