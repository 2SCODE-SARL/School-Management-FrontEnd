import { apiClient } from './client'

const base = (etablissementId) => `/academique/etablissements/${etablissementId}`

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

// Niveaux
export const listNiveaux = (etablissementId, { actif } = {}) =>
  apiClient.get(withQuery(`${base(etablissementId)}/niveaux`, { actif }))
export const createNiveau = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/niveaux`, data)
export const updateNiveau = (etablissementId, id, data) =>
  apiClient.patch(`${base(etablissementId)}/niveaux/${id}`, data)

// Séries (scopées à un niveau)
export const listSeries = (etablissementId, niveauId) =>
  apiClient.get(withQuery(`${base(etablissementId)}/series`, { niveauId }))
export const createSerie = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/series`, data)
export const updateSerie = (etablissementId, id, data) =>
  apiClient.patch(`${base(etablissementId)}/series/${id}`, data)

// Matières
export const listMatieres = (etablissementId, { type } = {}) =>
  apiClient.get(withQuery(`${base(etablissementId)}/matieres`, { type }))
export const createMatiere = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/matieres`, data)
export const updateMatiere = (etablissementId, id, data) =>
  apiClient.patch(`${base(etablissementId)}/matieres/${id}`, data)

// Salles
export const listSalles = (etablissementId, { type } = {}) =>
  apiClient.get(withQuery(`${base(etablissementId)}/salles`, { type }))
export const createSalle = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/salles`, data)
export const updateSalle = (etablissementId, id, data) =>
  apiClient.patch(`${base(etablissementId)}/salles/${id}`, data)

// Types d'évaluation (pas d'édition côté API : création + liste seulement)
export const listTypesEvaluation = (etablissementId) =>
  apiClient.get(`${base(etablissementId)}/types-evaluation`)
export const createTypeEvaluation = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/types-evaluation`, data)

// Classes (scopées à une année scolaire)
export const listClasses = (etablissementId, anneeScolaireId) =>
  apiClient.get(withQuery(`${base(etablissementId)}/classes`, { anneeScolaireId }))
export const getClasse = (etablissementId, id) =>
  apiClient.get(`${base(etablissementId)}/classes/${id}`)
export const createClasse = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/classes`, data)
export const updateClasse = (etablissementId, id, data) =>
  apiClient.patch(`${base(etablissementId)}/classes/${id}`, data)

// Matières affectées à une classe
export const listClasseMatieres = (etablissementId, classeId) =>
  apiClient.get(`${base(etablissementId)}/classes/${classeId}/matieres`)
export const assignMatiereClasse = (etablissementId, classeId, data) =>
  apiClient.post(`${base(etablissementId)}/classes/${classeId}/matieres`, data)
export const removeMatiereClasse = (etablissementId, classeId, matiereId) =>
  apiClient.delete(`${base(etablissementId)}/classes/${classeId}/matieres/${matiereId}`)

// Pondérations (poids de chaque type d'évaluation dans la moyenne, par année)
export const listPonderations = (etablissementId, anneeId) =>
  apiClient.get(`${base(etablissementId)}/annees/${anneeId}/ponderations`)
export const setPonderations = (etablissementId, anneeId, items) =>
  apiClient.post(`${base(etablissementId)}/annees/${anneeId}/ponderations`, { items })
