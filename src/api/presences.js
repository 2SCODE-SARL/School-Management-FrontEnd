import { apiClient } from './client'

const base = (etablissementId) => `/presences/etablissements/${etablissementId}`

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

// Présence du personnel (ne dépend pas d'un cours planifié)
export const pointerPersonnel = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/personnel`, data)
export const listPersonnelParDate = (etablissementId, date) =>
  apiClient.get(withQuery(`${base(etablissementId)}/personnel/date`, { date }))
export const getHistoriquePersonnel = (etablissementId, employeId) =>
  apiClient.get(`${base(etablissementId)}/personnel/${employeId}`)

// Accès (entrée/sortie) d'un élève
export const pointerAcces = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/acces`, data)
export const listAccesParDate = (etablissementId, date) =>
  apiClient.get(withQuery(`${base(etablissementId)}/acces/date`, { date }))
export const getHistoriqueAccesEleve = (etablissementId, eleveId) =>
  apiClient.get(`${base(etablissementId)}/acces/eleves/${eleveId}`)

// Alertes
export const createAlerte = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/alertes`, data)
export const listAlertes = (etablissementId, { type, lue } = {}) =>
  apiClient.get(withQuery(`${base(etablissementId)}/alertes`, { type, lue }))
export const marquerAlerteLue = (etablissementId, alerteId) =>
  apiClient.patch(`${base(etablissementId)}/alertes/${alerteId}/lue`)

// Observations & comportement élève (nécessitent un trimestre — à finir
// dans un second temps, une fois l'accès Enseignant aux trimestres vérifié)
export const createObservation = (etablissementId, eleveId, data) =>
  apiClient.post(`${base(etablissementId)}/eleves/${eleveId}/observations`, data)
export const listObservations = (etablissementId, eleveId) =>
  apiClient.get(`${base(etablissementId)}/eleves/${eleveId}/observations`)
export const setComportement = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/comportement`, data)
export const listComportement = (etablissementId, eleveId) =>
  apiClient.get(`${base(etablissementId)}/comportement/eleves/${eleveId}`)

// Justifier une présence/absence déjà enregistrée
export const justifierPresence = (etablissementId, presenceId, justificatifUrl) =>
  apiClient.patch(`${base(etablissementId)}/presences/${presenceId}/justifier`, { justificatifUrl })
