import { apiClient } from './client'

const base = (etablissementId) => `/inscriptions/etablissements/${etablissementId}/eleves`

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

/** GET .../eleves -> { items, total, page, limit, totalPages } */
export function searchEleves(etablissementId, { q, statut, page = 1, limit = 20 } = {}) {
  return apiClient.get(withQuery(base(etablissementId), { q, statut, page, limit }))
}

/** Détail d'un élève, avec ses inscriptions et parents rattachés. */
export function getEleve(etablissementId, id) {
  return apiClient.get(`${base(etablissementId)}/${id}`)
}

export function createEleve(etablissementId, data) {
  return apiClient.post(base(etablissementId), data)
}

export function updateEleve(etablissementId, id, data) {
  return apiClient.patch(`${base(etablissementId)}/${id}`, data)
}

/** Radiation (soft delete réversible, garde l'historique). */
export function radierEleve(etablissementId, id) {
  return apiClient.post(`${base(etablissementId)}/${id}/radier`)
}

/** Annule une radiation et restaure le statut antérieur de l'élève. */
export function annulerRadiationEleve(etablissementId, id) {
  return apiClient.post(`${base(etablissementId)}/${id}/annuler-radiation`)
}

/** Suppression logique définitive (révoque aussi ses accès portail). */
export function deleteEleve(etablissementId, id) {
  return apiClient.delete(`${base(etablissementId)}/${id}`)
}

/**
 * Provisionne le compte de connexion du portail élève — seulement une fois
 * l'inscription validée (élève passé à INSCRIT). Contrairement aux comptes
 * employés, pas de validation Directeur requise (confirmé par le backend :
 * opération répétitive, sans risque). Accessible Admin/Directeur/Secrétaire.
 */
export function provisionAccesPortailEleve(etablissementId, id, data) {
  return apiClient.post(`${base(etablissementId)}/${id}/acces-portail`, data)
}

/**
 * Nouveau (ajouté par le backend suite à notre remontée) :
 * { linked, statut: ACTIF|SUSPENDU|REVOQUE|null, utilisateur } — permet
 * enfin de savoir si un accès portail existe déjà pour cet élève.
 */
export function getAccesPortailEleveStatus(etablissementId, id) {
  return apiClient.get(`${base(etablissementId)}/${id}/acces-portail`)
}

/**
 * Nouveau (ajouté par le backend suite à notre remontée) : roster réel
 * d'une classe — plus besoin de chercher un élève par nom au hasard pour
 * la saisie de notes/classements/délibérations.
 */
export function listElevesClasse(etablissementId, classeId, { q, statut, page = 1, limit = 20 } = {}) {
  return apiClient.get(
    withQuery(`/inscriptions/etablissements/${etablissementId}/classes/${classeId}/eleves`, { q, statut, page, limit }),
  )
}
export function getEleveClasse(etablissementId, classeId, eleveId) {
  return apiClient.get(`/inscriptions/etablissements/${etablissementId}/classes/${classeId}/eleves/${eleveId}`)
}
