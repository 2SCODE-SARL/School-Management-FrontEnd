/** Statut de présence côté élève — distinct du statut personnel (PRESENT/ABSENT/RETARD/CONGE/MALADIE). */
export const ELEVE_PRESENCE_STATUT_LABELS = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  RETARD: 'Retard',
  JUSTIFIE: 'Justifié',
}
export function elevePresenceStatutBadgeVariant(statut) {
  if (statut === 'PRESENT') return 'success'
  if (statut === 'ABSENT') return 'danger'
  if (statut === 'RETARD') return 'warning'
  return 'neutral'
}

/** État d'un cours vu par l'élève — `REMPLACE` en plus de PLANIFIE/TERMINE/ANNULE. */
export const ELEVE_COURS_ETAT_LABELS = {
  PLANIFIE: 'Planifié',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
  REMPLACE: 'Remplacé',
}

export const BULLETIN_STATUT_LABELS = {
  BROUILLON: 'Brouillon',
  GENERE: 'Généré',
  PUBLIE: 'Publié',
  VALIDE: 'Validé',
}
export function bulletinStatutBadgeVariant(statut) {
  if (statut === 'PUBLIE' || statut === 'VALIDE') return 'success'
  if (statut === 'GENERE') return 'warning'
  return 'neutral'
}

export const DECISION_LABELS = {
  ADMIS: 'Admis',
  REDOUBLANT: 'Redoublant',
  CONSEIL: 'Conseil de classe',
}
export function decisionBadgeVariant(decision) {
  if (decision === 'ADMIS') return 'success'
  if (decision === 'REDOUBLANT') return 'danger'
  return 'warning'
}

/** Statut de parcours annuel de l'élève. */
export const PARCOURS_STATUT_LABELS = {
  NOUVEAU: 'Nouveau',
  ADMIS: 'Admis',
  REDOUBLANT: 'Redoublant',
  TRANSFERE: 'Transféré',
}

export const DOCUMENT_ELEVE_TYPE_LABELS = {
  CERTIFICAT_SCOLARITE: 'Certificat de scolarité',
  RELEVE_NOTES: 'Relevé de notes',
  ATTESTATION: 'Attestation',
  BULLETIN: 'Bulletin',
}
