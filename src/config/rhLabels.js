export const EMPLOYE_TYPE_LABELS = {
  ENSEIGNANT: 'Enseignant',
  ADMINISTRATIF: 'Administratif',
  TECHNIQUE: 'Technique',
}
export const EMPLOYE_TYPE_OPTIONS = Object.entries(EMPLOYE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const TYPE_CONTRAT_LABELS = {
  PERMANENT: 'Permanent',
  VACATAIRE: 'Vacataire',
}
export const TYPE_CONTRAT_OPTIONS = Object.entries(TYPE_CONTRAT_LABELS).map(
  ([value, label]) => ({ value, label }),
)

/**
 * `Contrat` (nouvelle entité RH) : la rémunération de référence de la paie
 * vient désormais du contrat actif couvrant la période, plus de
 * `Employe.salaireBase` (conservé côté fiche mais purement indicatif).
 */
export const CONTRAT_TYPE_LABELS = {
  CDI: 'CDI',
  CDD: 'CDD',
  STAGE: 'Stage',
}
export const CONTRAT_TYPE_OPTIONS = Object.entries(CONTRAT_TYPE_LABELS).map(([value, label]) => ({ value, label }))

export const CONTRAT_STATUT_LABELS = {
  ACTIF: 'Actif',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
}
export const CONTRAT_STATUT_OPTIONS = Object.entries(CONTRAT_STATUT_LABELS).map(([value, label]) => ({ value, label }))
export function contratStatutBadgeVariant(statut) {
  if (statut === 'ACTIF') return 'success'
  if (statut === 'ANNULE') return 'danger'
  return 'neutral'
}

/** `DossierPaie.etat` : A_COMPLETER tant qu'aucun contrat rémunéré n'est en place, ACTIF une fois éligible à la paie. */
export const DOSSIER_PAIE_ETAT_LABELS = {
  A_COMPLETER: 'À compléter',
  ACTIF: 'Actif',
}
export function dossierPaieEtatBadgeVariant(etat) {
  return etat === 'ACTIF' ? 'success' : 'warning'
}

/**
 * Rôles proposables pour le compte imbriqué/provisionné d'un employé
 * (CreateEmployeAccountDto.roleCode) — Directeur et Administrateur ne
 * passent jamais par ce chemin (comptes créés via Utilisateurs).
 */
export const COMPTE_EMPLOYE_ROLE_LABELS = {
  ENSEIGNANT: 'Enseignant',
  COMPTABLE: 'Comptable',
  SECRETAIRE: 'Secrétaire',
  SURVEILLANT: 'Surveillant général',
}
export const COMPTE_EMPLOYE_ROLE_OPTIONS = Object.entries(COMPTE_EMPLOYE_ROLE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

/** Type d'employé -> rôle de compte par défaut le plus probable. */
export const EMPLOYE_TYPE_TO_DEFAULT_ROLE = {
  ENSEIGNANT: 'ENSEIGNANT',
  ADMINISTRATIF: 'SECRETAIRE',
  TECHNIQUE: 'SECRETAIRE',
}

/**
 * Correspondance indicative rôle Utilisateur -> type d'Employé, pour
 * pré-filtrer la liste des fiches à lier lors de la création d'un compte
 * (ex: rôle Enseignant -> ne propose que les fiches de type ENSEIGNANT).
 * Les rôles administratifs (Surveillant/Secrétaire/Comptable) n'ont pas de
 * type dédié côté Employé : ils tombent tous sous ADMINISTRATIF.
 */
export const ROLE_TO_EMPLOYE_TYPE = {
  ENSEIGNANT: 'ENSEIGNANT',
  SURVEILLANT: 'ADMINISTRATIF',
  SECRETAIRE: 'ADMINISTRATIF',
  COMPTABLE: 'ADMINISTRATIF',
}
