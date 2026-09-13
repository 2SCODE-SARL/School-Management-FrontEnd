export const PERSONNEL_STATUT_LABELS = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  RETARD: 'Retard',
  CONGE: 'Congé',
  MALADIE: 'Maladie',
}
export const PERSONNEL_STATUT_OPTIONS = Object.entries(PERSONNEL_STATUT_LABELS).map(
  ([value, label]) => ({ value, label }),
)
export function personnelStatutBadgeVariant(statut) {
  if (statut === 'PRESENT') return 'success'
  if (statut === 'ABSENT') return 'danger'
  if (statut === 'RETARD' || statut === 'MALADIE') return 'warning'
  return 'neutral'
}

export const ACCES_TYPE_LABELS = { ENTREE: 'Entrée', SORTIE: 'Sortie' }
export const ACCES_TYPE_OPTIONS = Object.entries(ACCES_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const ACCES_SOURCE_LABELS = { BADGE: 'Badge', GPS: 'GPS', MANUEL: 'Manuel' }
export const ACCES_SOURCE_OPTIONS = Object.entries(ACCES_SOURCE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const ALERTE_TYPE_LABELS = {
  ABSENCE: 'Absence',
  IMPAYE: 'Impayé',
  EXAMEN_SEMAINE: 'Examen (semaine)',
  DOCUMENT_MANQUANT: 'Document manquant',
  RELANCE: 'Relance',
  ANNIVERSAIRE: 'Anniversaire',
  ECHEC: 'Échec',
  NOTE_CORRECTION: 'Correction de note',
}
export const ALERTE_TYPE_OPTIONS = Object.entries(ALERTE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const ALERTE_NIVEAU_LABELS = { INFO: 'Info', WARNING: 'Attention', CRITIQUE: 'Critique' }
export const ALERTE_NIVEAU_OPTIONS = Object.entries(ALERTE_NIVEAU_LABELS).map(([value, label]) => ({
  value,
  label,
}))
export function alerteNiveauBadgeVariant(niveau) {
  if (niveau === 'CRITIQUE') return 'danger'
  if (niveau === 'WARNING') return 'warning'
  return 'neutral'
}
