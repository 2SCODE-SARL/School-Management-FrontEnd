import { apiClient } from './client'

const base = (etablissementId) => `/resultats/etablissements/${etablissementId}`

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

/**
 * Module Résultats — phase 1 : examens + notes + publication (Enseignant).
 * Phase 2 : classements, bulletins, délibérations, réclamations.
 * Phase 3 (ici) : appréciations (par matière, Enseignant) et avis de
 * direction (par élève, Directeur/Admin) — aucun `GET` n'existe pour ni
 * l'un ni l'autre (seulement `POST`, sémantique "Set" = upsert), pas de
 * liste possible côté frontend.
 */

// Examens (= évaluations : devoir, composition...)
export const listExamens = (etablissementId, { classeId, matiereId, trimestreId, statut, page, limit } = {}) =>
  apiClient.get(withQuery(`${base(etablissementId)}/examens`, { classeId, matiereId, trimestreId, statut, page, limit }))
export const getExamen = (etablissementId, examenId) =>
  apiClient.get(`${base(etablissementId)}/examens/${examenId}`)
export const createExamen = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/examens`, data)
/** `SetExamenStatutDto` : { statut }, enum PROGRAMME/EN_COURS/TERMINE/PUBLIE (forward-only, comme les inscriptions). */
export const setExamenStatut = (etablissementId, examenId, statut) =>
  apiClient.patch(`${base(etablissementId)}/examens/${examenId}/statut`, { statut })
/** Publier rend les notes visibles élèves/parents — sans body. */
export const publierExamen = (etablissementId, examenId) =>
  apiClient.post(`${base(etablissementId)}/examens/${examenId}/publier`)

// Notes
/** `SaisirNotesDto` : { notes: [{ eleveId, valeur, commentaire? }] } — plusieurs élèves en une requête. */
export const saisirNotes = (etablissementId, examenId, notes) =>
  apiClient.post(`${base(etablissementId)}/examens/${examenId}/notes`, { notes })
export const listNotes = (etablissementId, examenId) =>
  apiClient.get(`${base(etablissementId)}/examens/${examenId}/notes`)
/** Sans body. */
export const validerNote = (etablissementId, noteId) =>
  apiClient.patch(`${base(etablissementId)}/notes/${noteId}/valider`)

// Classements
export const getClassement = (etablissementId, classeId, trimestreId) =>
  apiClient.get(`${base(etablissementId)}/classes/${classeId}/trimestres/${trimestreId}/classement`)
export const getTop = (etablissementId, trimestreId, limit) =>
  apiClient.get(withQuery(`${base(etablissementId)}/trimestres/${trimestreId}/top`, { limit }))

// Bulletins (un par élève + trimestre)
/** Sans body — calcule à partir des notes déjà saisies/validées. */
export const genererBulletin = (etablissementId, eleveId, trimestreId) =>
  apiClient.post(`${base(etablissementId)}/eleves/${eleveId}/trimestres/${trimestreId}/bulletin`)
export const getBulletin = (etablissementId, eleveId, trimestreId) =>
  apiClient.get(`${base(etablissementId)}/eleves/${eleveId}/trimestres/${trimestreId}/bulletin`)
/** Sans body — rend le bulletin visible côté portails élève/parent. */
export const publierBulletin = (etablissementId, bulletinId) =>
  apiClient.patch(`${base(etablissementId)}/bulletins/${bulletinId}/publier`)

// Délibérations — AUCUN endpoint de liste/lecture n'existe dans la doc :
// une fois créée, la délibération n'est atteignable que via l'id renvoyé
// par sa création (à garder en mémoire côté client pour la session en
// cours) — signalé au backend comme un manque.
/** `CreerDeliberationDto` : { trimestreId, classeId }. */
export const createDeliberation = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/deliberations`, data)
/** `AjouterMembreDto` : { employeId, role: PRESIDENT|RAPPORTEUR|MEMBRE }. */
export const ajouterMembreDeliberation = (etablissementId, deliberationId, data) =>
  apiClient.post(`${base(etablissementId)}/deliberations/${deliberationId}/membres`, data)
/** `DeciderDto` : { eleveId, decision: ADMIS|REDOUBLANT|CONSEIL, motif? }. */
export const ajouterDecisionDeliberation = (etablissementId, deliberationId, data) =>
  apiClient.post(`${base(etablissementId)}/deliberations/${deliberationId}/decisions`, data)
/** Sans body. */
export const cloturerDeliberation = (etablissementId, deliberationId) =>
  apiClient.patch(`${base(etablissementId)}/deliberations/${deliberationId}/cloturer`)

/**
 * Réclamations — refondu par le backend (suite à notre remontée -7) :
 * ce n'est plus le Parent qui conteste (`demanderCorrection`/
 * `DemanderCorrectionDto` ont disparu, l'ancien endpoint renvoie
 * désormais 404), mais l'ÉLÈVE lui-même, pendant une période que
 * l'Enseignant doit ouvrir pour l'examen concerné (`CreerReclamationNoteDto`
 * côté `api/portailEleve.js`). `GET .../reclamations` est maintenant scopé
 * à l'Enseignant : "uniquement les réclamations qui lui sont affectées" —
 * Admin/Directeur n'y ont plus accès du tout (changement de rôle
 * intentionnel, pas une régression).
 */
export const listReclamations = (etablissementId, statut) =>
  apiClient.get(withQuery(`${base(etablissementId)}/reclamations`, { statut }))
/** `RepondreReclamationDto` : { statut: EN_REVISION|ACCEPTEE|REFUSEE, reponseProf, nouvelleValeur? }. */
export const repondreReclamation = (etablissementId, demandeId, data) =>
  apiClient.patch(`${base(etablissementId)}/reclamations/${demandeId}`, data)
/** `OuvrirPeriodeReclamationDto` : { dateDebut, dateFin } (ISO date-time) — Enseignant, pour un examen déjà publié. */
export const ouvrirPeriodeReclamation = (etablissementId, examenId, data) =>
  apiClient.post(`${base(etablissementId)}/examens/${examenId}/reclamations/periode`, data)
export const getPeriodeReclamation = (etablissementId, examenId) =>
  apiClient.get(`${base(etablissementId)}/examens/${examenId}/reclamations/periode`)

// Appréciations (par matière) et avis de direction (par élève) —
// `SetAppreciationDto`/`SetAvisDirectionDto` pour écrire, upsert par
// (eleveId, matiereId?, trimestreId). Le `GET` par élève+trimestre a été
// ajouté par le backend suite à notre remontée -9 : `AppreciationReadDto[]`
// (Admin/Directeur/Enseignant) et `AvisDirectionReadDto` (Admin/Directeur).
export const setAppreciation = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/appreciations`, data)
export const setAvisDirection = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/avis-direction`, data)
export const listAppreciations = (etablissementId, eleveId, trimestreId) =>
  apiClient.get(`${base(etablissementId)}/eleves/${eleveId}/trimestres/${trimestreId}/appreciations`)
export const getAvisDirection = (etablissementId, eleveId, trimestreId) =>
  apiClient.get(`${base(etablissementId)}/eleves/${eleveId}/trimestres/${trimestreId}/avis-direction`)
