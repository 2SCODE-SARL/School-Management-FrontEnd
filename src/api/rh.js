import { apiClient } from './client'

const base = (etablissementId) => `/rh/etablissements/${etablissementId}`

const EMPLOYE_TYPES = ['ENSEIGNANT', 'ADMINISTRATIF', 'TECHNIQUE']

function normalizeList(data) {
  return Array.isArray(data) ? data : (data?.items ?? [])
}

/**
 * Un "employé" (RH) est une fiche distincte d'un compte Utilisateur — sans
 * lien direct entre les deux dans la doc (CreateEmployeDto n'a pas de
 * userId). C'est CETTE ressource que `AssignMatiereDto.enseignantId`
 * attend (le endpoint `/emplois-du-temps/.../enseignants/{employeId}/...`
 * le confirme aussi) — pas l'id d'un compte Utilisateur avec le rôle
 * Enseignant.
 *
 * `type` est réellement obligatoire côté API (confirmé par un 400 sur
 * `type=` vide — "tous les types" n'existe pas côté serveur). Sans `type`
 * fourni ici, on interroge donc les 3 types un par un et on fusionne, pour
 * simuler un "tous les types" côté frontend.
 */
export async function searchEmployes(etablissementId, { q = '', type = '' } = {}) {
  const types = type ? [type] : EMPLOYE_TYPES
  const results = await Promise.all(
    types.map((t) => {
      const params = new URLSearchParams({ q, type: t })
      return apiClient.get(`${base(etablissementId)}/employes?${params.toString()}`)
    }),
  )
  return results.flatMap(normalizeList)
}

export function getEmploye(etablissementId, employeId) {
  return apiClient.get(`${base(etablissementId)}/employes/${employeId}`)
}

export function createEmploye(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/employes`, data)
}

/** Modifier les infos métier (nom/prénom/contrat/salaire/dateEmbauche) — pas le type. Admin/Directeur seulement. */
export function updateEmploye(etablissementId, employeId, data) {
  return apiClient.patch(`${base(etablissementId)}/employes/${employeId}`, data)
}

/** Suppression logique d'une fiche employé. Admin/Directeur seulement. */
export function deleteEmploye(etablissementId, employeId) {
  return apiClient.delete(`${base(etablissementId)}/employes/${employeId}`)
}

export function setEmployeActif(etablissementId, employeId, actif) {
  return apiClient.patch(`${base(etablissementId)}/employes/${employeId}/actif`, { actif })
}

/**
 * Provisionne le compte de connexion d'une fiche Employé déjà existante
 * (celle-ci n'a pas encore été créée avec un `compte` imbriqué). Ouvert
 * aussi au Secrétaire.
 */
export function provisionnerCompteEmploye(etablissementId, employeId, data) {
  return apiClient.post(`${base(etablissementId)}/employes/${employeId}/compte`, data)
}

/**
 * Comptes employés provisionnés par un Secrétaire, en attente de validation.
 * Le Secrétaire peut désormais la CONSULTER (pour voir le statut de ses
 * propres provisionnements) mais valider/refuser reste Admin/Directeur.
 */
export function listComptesEnAttente(etablissementId) {
  return apiClient.get(`${base(etablissementId)}/comptes-employes/en-attente`)
}

export function validerCompteEmploye(etablissementId, utilisateurId) {
  return apiClient.patch(`${base(etablissementId)}/comptes-employes/${utilisateurId}/valider`)
}

export function refuserCompteEmploye(etablissementId, utilisateurId, motif) {
  return apiClient.patch(`${base(etablissementId)}/comptes-employes/${utilisateurId}/refuser`, {
    ...(motif ? { motif } : {}),
  })
}

/**
 * Matières qu'un enseignant est habilité à enseigner — une étape RH à part,
 * requise AVANT de pouvoir l'affecter à cette matière dans une classe
 * (sinon "Cet enseignant n'est pas habilité pour cette matière"). Chaque
 * fiche employé renvoyée par `searchEmployes` porte déjà son tableau
 * `matieres`, pas besoin d'un GET séparé.
 */
export function assignMatiereEmploye(etablissementId, employeId, matiereId) {
  return apiClient.post(`${base(etablissementId)}/employes/${employeId}/matieres`, { matiereId })
}

export function removeMatiereEmploye(etablissementId, employeId, matiereId) {
  return apiClient.delete(`${base(etablissementId)}/employes/${employeId}/matieres/${matiereId}`)
}

/**
 * Rattache un compte Utilisateur EXISTANT (ex: un Directeur déjà connecté)
 * à un nouveau dossier Employé + DossierPaie — sans créer de second compte.
 * 409 si ce compte a déjà un employé lié. Admin/Directeur/Secrétaire.
 */
export function createEmployeFromUser(etablissementId, utilisateurId, data) {
  return apiClient.post(`${base(etablissementId)}/utilisateurs/${utilisateurId}/employe`, data)
}

/**
 * Nouveau (ajouté par le backend suite à notre remontée) : { linked, employe }
 * — permet enfin de savoir AVANT de cliquer si ce compte a déjà un dossier
 * employé, au lieu de compter sur un 409.
 */
export function getEmployeLinkStatus(etablissementId, utilisateurId) {
  return apiClient.get(`${base(etablissementId)}/utilisateurs/${utilisateurId}/employe`)
}

/**
 * Le DossierPaie est créé automatiquement (A_COMPLETER) avec l'employé —
 * jamais créé à la main ici, seulement activé une fois un contrat rémunéré
 * en place. Admin/Directeur seulement.
 */
export function setDossierPaieEtat(etablissementId, employeId, etat) {
  return apiClient.patch(`${base(etablissementId)}/employes/${employeId}/dossier-paie`, { etat })
}

// Contrats (CDI/CDD/STAGE) — la rémunération de référence de la paie vient
// du contrat actif couvrant la période, plus de `Employe.salaireBase`.
export function listContrats(etablissementId, employeId) {
  return apiClient.get(`${base(etablissementId)}/employes/${employeId}/contrats`)
}
export function createContrat(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/contrats`, data)
}
export function setContratStatut(etablissementId, contratId, statut) {
  return apiClient.patch(`${base(etablissementId)}/contrats/${contratId}/statut`, { statut })
}
