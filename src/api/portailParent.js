import { apiClient } from './client'

const base = '/portail-parents'

/**
 * Portail Parent — contrairement au portail Élève, ces réponses ne sont
 * PAS typées dans la doc (`ApiSuccessResponse` générique). Elles couvrent
 * probablement les mêmes données que le portail Élève (notes/bulletins/
 * présences/résultats), juste scopées par enfant — on part de cette
 * hypothèse pour les noms de champs, à ajuster une fois testé en live.
 */
export const getMesEnfants = () => apiClient.get(`${base}/mes-enfants`)
export const getEnfantNotes = (eleveId) => apiClient.get(`${base}/enfants/${eleveId}/notes`)
export const getEnfantBulletins = (eleveId) => apiClient.get(`${base}/enfants/${eleveId}/bulletins`)
export const getEnfantPresences = (eleveId) => apiClient.get(`${base}/enfants/${eleveId}/presences`)
export const getEnfantAcces = (eleveId) => apiClient.get(`${base}/enfants/${eleveId}/acces`)
export const getEnfantResultats = (eleveId) => apiClient.get(`${base}/enfants/${eleveId}/resultats`)

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}
// Appréciations/avis de direction d'un enfant — lecture seule, ajoutés en
// même temps que leur équivalent élève (`AppreciationReadDto[]`,
// `AvisDirectionReadDto`, typés côté doc).
export const getEnfantAppreciations = (eleveId, trimestreId) =>
  apiClient.get(withQuery(`${base}/enfants/${eleveId}/appreciations`, { trimestreId }))
export const getEnfantAvisDirection = (eleveId, trimestreId) =>
  apiClient.get(withQuery(`${base}/enfants/${eleveId}/avis-direction`, { trimestreId }))

// Demandes (certificat, correction de note, congé...) — le parent crée,
// le Directeur/Secrétaire répond (voir api/demandes.js côté staff).
/** `CreerDemandeParentaleDto` : etablissementId, eleveId, sujet, description, motifId?. */
export const createDemande = (data) => apiClient.post(`${base}/demandes`, data)
export const listMesDemandes = () => apiClient.get(`${base}/mes-demandes`)

// Rattachement à un nouvel élève (consentement) — quand un établissement
// demande à ce Parent (déjà connu ailleurs sur la plateforme) d'approuver
// qu'un élève chez eux est bien son enfant, avant de l'ajouter à sa liste
// d'enfants. Le Parent voit les infos de l'élève AVANT de décider.
export const listDemandesRattachement = () => apiClient.get(`${base}/demandes-rattachement`)
export const getDemandeRattachement = (demandeId) => apiClient.get(`${base}/demandes-rattachement/${demandeId}`)
export const accepterRattachement = (demandeId) => apiClient.post(`${base}/demandes-rattachement/${demandeId}/accepter`)
export const refuserRattachement = (demandeId) => apiClient.post(`${base}/demandes-rattachement/${demandeId}/refuser`)
