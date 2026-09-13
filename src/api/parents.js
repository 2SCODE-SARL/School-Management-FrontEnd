import { apiClient } from './client'

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

/**
 * `CreateParentDto` exige `etablissementId`/`eleveId` : la création et le
 * rattachement à l'élève se font atomiquement en un seul appel (confirmé
 * par un 400 "etablissementId/eleveId must be a UUID" quand on les
 * omettait) — pas besoin d'un second appel à `linkParentToEleve` derrière,
 * qui sert seulement à rattacher un parent DÉJÀ existant à un AUTRE élève
 * du MÊME établissement (ex: fratrie, visible via sa fiche).
 */
export function createParent(etablissementId, eleveId, data) {
  return apiClient.post('/inscriptions/parents', { ...data, etablissementId, eleveId })
}

/**
 * Liste les parents déjà rattachés à l'établissement (recherche par nom via
 * `q`) — ajouté par le backend suite à notre remontée ("pas d'endpoint pour
 * lister tous les parents").
 */
export function listParentsEtablissement(etablissementId, { q, page, limit } = {}) {
  return apiClient.get(withQuery(`/inscriptions/etablissements/${etablissementId}/parents`, { q, page, limit }))
}

/**
 * Rattachement d'un parent EXISTANT AILLEURS sur la plateforme (autre
 * établissement) à un élève de l'établissement courant — sans le
 * dupliquer ni deviner son identité par email+nom. Contrairement à
 * `createParent`/`linkParentToEleve`, ceci ne rattache pas immédiatement :
 * ça crée une demande que le Parent doit lui-même approuver ou refuser
 * depuis son portail (`portail-parents/demandes-rattachement/...`), après
 * avoir vu les infos de l'élève concerné — ça évite qu'un établissement
 * rattache par erreur (ou abusivement) un enfant qui n'est pas le sien.
 */
export function demanderRattachement(etablissementId, { eleveId, email }) {
  return apiClient.post(`/inscriptions/etablissements/${etablissementId}/parents/rattachements`, {
    eleveId,
    email,
  })
}

export function getParent(id) {
  return apiClient.get(`/inscriptions/parents/${id}`)
}

export function updateParent(id, data) {
  return apiClient.patch(`/inscriptions/parents/${id}`, data)
}

export function linkParentToEleve(parentId, eleveId, etablissementId) {
  return apiClient.post(`/inscriptions/parents/${parentId}/eleves`, {
    eleveId,
    etablissementId,
  })
}

export function unlinkParentFromEleve(parentId, eleveId) {
  return apiClient.delete(`/inscriptions/parents/${parentId}/eleves/${eleveId}`)
}

/**
 * Contrairement à l'élève, aucun body : le backend provisionne (ou réutilise
 * le compte global existant si ce parent a déjà un enfant ailleurs) et
 * envoie lui-même l'invitation par email — pas d'email/mot de passe à saisir.
 */
export function provisionAccesPortailParent(etablissementId, parentId) {
  return apiClient.post(`/inscriptions/etablissements/${etablissementId}/parents/${parentId}/acces-portail`)
}

/** Renvoie l'invitation si le parent ne l'a pas activée (compte "inactif"). */
export function reinviteAccesPortailParent(etablissementId, parentId) {
  return apiClient.post(`/inscriptions/etablissements/${etablissementId}/parents/${parentId}/acces-portail/invitation`)
}
