import { apiClient } from './client'

const base = (etablissementId) => `/emplois-du-temps/etablissements/${etablissementId}`

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

// Cours (séances planifiées) — la base du module, dont dépend le pointage
// de présence des élèves (Présences a besoin d'un coursId).
export const listCours = (etablissementId, { classeId, employeId, jourSemaine } = {}) =>
  apiClient.get(withQuery(`${base(etablissementId)}/cours`, { classeId, employeId, jourSemaine }))
export const getCours = (etablissementId, coursId) =>
  apiClient.get(`${base(etablissementId)}/cours/${coursId}`)
export const createCours = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/cours`, data)
export const updateCours = (etablissementId, coursId, data) =>
  apiClient.patch(`${base(etablissementId)}/cours/${coursId}`, data)
export const terminerCours = (etablissementId, coursId) =>
  apiClient.patch(`${base(etablissementId)}/cours/${coursId}/terminer`)
export const annulerCours = (etablissementId, coursId) =>
  apiClient.patch(`${base(etablissementId)}/cours/${coursId}/annuler`)

// Conflits (détectés automatiquement à la création/modif d'un cours)
export const listConflits = (etablissementId) =>
  apiClient.get(`${base(etablissementId)}/conflits`)

// Disponibilités d'un enseignant
export const getDisponibilites = (etablissementId, employeId) =>
  apiClient.get(`${base(etablissementId)}/enseignants/${employeId}/disponibilites`)
export const setDisponibilites = (etablissementId, employeId, data) =>
  apiClient.post(`${base(etablissementId)}/enseignants/${employeId}/disponibilites`, data)

// Remplacements
export const listRemplacements = (etablissementId) =>
  apiClient.get(`${base(etablissementId)}/remplacements`)
export const createRemplacement = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/remplacements`, data)
export const cloturerRemplacement = (etablissementId, remplacementId) =>
  apiClient.patch(`${base(etablissementId)}/remplacements/${remplacementId}/cloturer`)

// Génération automatique de l'emploi du temps d'une classe
export const genererEmploiDuTemps = (etablissementId, classeId, data) =>
  apiClient.post(`${base(etablissementId)}/classes/${classeId}/generer`, data)
