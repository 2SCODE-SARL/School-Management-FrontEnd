import { apiClient } from './client'

const base = '/portail-eleves/me'

/**
 * Portail Élève — contrairement à la plupart des autres modules, ces
 * réponses SONT correctement typées dans la doc (DTOs `PortailEleve*`) :
 * pas besoin de deviner les noms de champs ici, une exception bienvenue.
 * Purement en lecture (aucune écriture côté élève).
 */
export const getProfil = () => apiClient.get(base)
export const getClasseCourante = () => apiClient.get(`${base}/classe`)
export const getEmploiDuTemps = () => apiClient.get(`${base}/emploi-du-temps`)
export const getPresences = () => apiClient.get(`${base}/presences`)
export const getNotes = () => apiClient.get(`${base}/notes`)
export const getResultats = () => apiClient.get(`${base}/resultats`)
export const listBulletins = () => apiClient.get(`${base}/bulletins`)
export const getBulletin = (bulletinId) => apiClient.get(`${base}/bulletins/${bulletinId}`)
export const getBulletinPdf = (bulletinId) => apiClient.get(`${base}/bulletins/${bulletinId}/pdf`)
export const getParcours = () => apiClient.get(`${base}/parcours`)

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}
/** `telechargementUrl` est déjà un lien signé prêt à ouvrir — pas de second appel nécessaire. */
export const listDocuments = ({ page, limit, type } = {}) =>
  apiClient.get(withQuery(`${base}/documents`, { page, limit, type }))

// Réclamations de notes — nouveau workflow : c'est l'ÉLÈVE qui dépose la
// réclamation (plus le Parent), pendant une période que l'Enseignant doit
// ouvrir pour l'examen concerné. `GET .../notes` renvoie directement un
// champ `reclamation` par note (`PortailEleveReclamationDisponibiliteDto` :
// statutPeriode, peutReclamer, demande?) — pas besoin d'appel séparé pour
// savoir si on peut contester une note donnée.
/** `CreerReclamationNoteDto` : motif*, detail?. */
export const creerReclamation = (noteId, data) => apiClient.post(`${base}/notes/${noteId}/reclamations`, data)
export const listMesReclamations = () => apiClient.get(`${base}/reclamations`)

// Appréciations (par matière) et avis de direction — lecture seule,
// typées (`AppreciationReadDto[]`, `AvisDirectionReadDto`).
export const getMesAppreciations = (trimestreId) => apiClient.get(withQuery(`${base}/appreciations`, { trimestreId }))
export const getMonAvisDirection = (trimestreId) => apiClient.get(withQuery(`${base}/avis-direction`, { trimestreId }))
