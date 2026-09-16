import { apiClient } from './client'

const base = (etablissementId) => `/inscriptions/etablissements/${etablissementId}`

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

/** Préinscription : crée l'élève + ses parents + son dossier d'inscription en une fois. */
export function preinscrire(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/preinscrire`, data)
}

/** `anneeScolaireId` et `statut` sont tous les deux requis côté API. */
export function listInscriptions(etablissementId, { anneeScolaireId, statut, page, limit }) {
  return apiClient.get(withQuery(`${base(etablissementId)}/inscriptions`, { anneeScolaireId, statut, page, limit }))
}

export function getInscription(etablissementId, inscriptionId) {
  return apiClient.get(`${base(etablissementId)}/inscriptions/${inscriptionId}`)
}

/** Affectation manuelle à une classe précise. */
export function affecterInscription(etablissementId, inscriptionId, classeId) {
  return apiClient.post(`${base(etablissementId)}/inscriptions/${inscriptionId}/affecter`, { classeId })
}

/** Affectation automatique à la classe la moins pleine du niveau demandé. */
export function affectationAutoInscription(etablissementId, inscriptionId) {
  return apiClient.post(`${base(etablissementId)}/inscriptions/${inscriptionId}/affectation-auto`)
}

/** Valide l'inscription : fait passer l'élève au statut INSCRIT. */
export function validerInscription(etablissementId, inscriptionId) {
  return apiClient.post(`${base(etablissementId)}/inscriptions/${inscriptionId}/valider`)
}

/**
 * Transition du DOSSIER d'inscription lui-même (BROUILLON, SOUMISE,
 * COMPLETE, VALIDEE, REFUSEE) — différent de `validerInscription` qui agit
 * sur le statut de l'élève.
 */
export function changerStatutInscription(etablissementId, inscriptionId, statut) {
  return apiClient.patch(`${base(etablissementId)}/inscriptions/${inscriptionId}/statut`, { statut })
}

/** Réinscrit un élève déjà connu (admis/redoublant/transféré) pour une nouvelle année. */
export function reinscrire(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/reinscrire`, data)
}

// Types de documents (établissement-wide, création + liste seulement — pas
// d'endpoint d'édition côté API).
export function listTypesDocuments(etablissementId) {
  return apiClient.get(`${base(etablissementId)}/types-documents`)
}
export function createTypeDocument(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/types-documents`, data)
}

// Documents d'une inscription — étape requise avant "Validée" d'après le
// backend (documents obligatoires OK), même si non technique ment vérifié
// par la transition de statut elle-même.
export function listInscriptionDocuments(etablissementId, inscriptionId) {
  return apiClient.get(`${base(etablissementId)}/inscriptions/${inscriptionId}/documents`)
}
export function uploadInscriptionDocument(etablissementId, inscriptionId, data) {
  return apiClient.post(`${base(etablissementId)}/inscriptions/${inscriptionId}/documents`, data)
}
export function setDocumentStatut(etablissementId, documentId, statut) {
  return apiClient.patch(`${base(etablissementId)}/documents/${documentId}/statut`, { statut })
}

/**
 * Nouveau (ajouté par le backend suite à notre remontée -14) : même
 * principe que le module Documentation général — renvoie une URL signée
 * temporaire pour un document d'inscription, au lieu du chemin de stockage
 * brut (`s3://...`) jusqu'ici inutilisable côté staff.
 */
export function getDocumentEleveTelechargement(etablissementId, documentId) {
  return apiClient.get(`${base(etablissementId)}/documents/${documentId}/telechargement`)
}
