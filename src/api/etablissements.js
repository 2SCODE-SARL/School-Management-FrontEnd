import { apiClient } from './client'

/** GET /api/etablissements -> { items, total, page, limit, totalPages } */
export function searchEtablissements({ q, actif, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (actif !== undefined && actif !== null) params.set('actif', actif)
  params.set('page', page)
  params.set('limit', limit)
  return apiClient.get(`/etablissements?${params.toString()}`)
}

export function getEtablissement(id) {
  return apiClient.get(`/etablissements/${id}`)
}

export function createEtablissement(data) {
  return apiClient.post('/etablissements', data)
}

export function updateEtablissement(id, data) {
  return apiClient.patch(`/etablissements/${id}`, data)
}

export function activateEtablissement(id) {
  return apiClient.patch(`/etablissements/${id}/activate`)
}

export function deactivateEtablissement(id) {
  return apiClient.patch(`/etablissements/${id}/deactivate`)
}

// Années scolaires (+ leurs trimestres, créés automatiquement à la création
// de l'année). Ouvertes en lecture/écriture à l'Admin ET au Directeur.
export function listAnneesScolaires(etablissementId) {
  return apiClient.get(`/etablissements/${etablissementId}/annees`)
}

export function getAnneeScolaire(etablissementId, anneeId) {
  return apiClient.get(`/etablissements/${etablissementId}/annees/${anneeId}`)
}

export function createAnneeScolaire(etablissementId, data) {
  return apiClient.post(`/etablissements/${etablissementId}/annees`, data)
}

export function updateAnneeScolaire(etablissementId, anneeId, data) {
  return apiClient.patch(`/etablissements/${etablissementId}/annees/${anneeId}`, data)
}

export function ouvrirAnneeScolaire(etablissementId, anneeId) {
  return apiClient.post(`/etablissements/${etablissementId}/annees/${anneeId}/ouvrir`)
}

export function fermerAnneeScolaire(etablissementId, anneeId) {
  return apiClient.post(`/etablissements/${etablissementId}/annees/${anneeId}/fermer`)
}

export function updateTrimestre(etablissementId, anneeId, trimestreId, data) {
  return apiClient.patch(
    `/etablissements/${etablissementId}/annees/${anneeId}/trimestres/${trimestreId}`,
    data,
  )
}

export function setTrimestreStatut(etablissementId, anneeId, trimestreId, statut) {
  return apiClient.patch(
    `/etablissements/${etablissementId}/annees/${anneeId}/trimestres/${trimestreId}/statut`,
    { statut },
  )
}
