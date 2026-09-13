/** Statut d'un examen — forward-only comme les inscriptions/cours. */
export const EXAMEN_STATUT_LABELS = {
  PROGRAMME: 'Programmé',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  PUBLIE: 'Publié',
}
export const EXAMEN_STATUT_OPTIONS = Object.entries(EXAMEN_STATUT_LABELS).map(([value, label]) => ({
  value,
  label,
}))
const EXAMEN_STATUT_ORDER = ['PROGRAMME', 'EN_COURS', 'TERMINE', 'PUBLIE']

export function examenStatutBadgeVariant(statut) {
  if (statut === 'PUBLIE') return 'success'
  if (statut === 'TERMINE') return 'warning'
  if (statut === 'EN_COURS') return 'primary'
  return 'neutral'
}

/** Prochains statuts atteignables (transition avant uniquement, jamais en arrière). */
export function getNextExamenStatutOptions(statut) {
  const index = EXAMEN_STATUT_ORDER.indexOf(statut)
  if (index === -1 || index === EXAMEN_STATUT_ORDER.length - 1) return []
  return EXAMEN_STATUT_ORDER.slice(index + 1).map((value) => ({
    value,
    label: EXAMEN_STATUT_LABELS[value],
  }))
}

/** Statut d'une réclamation (contestation de note par un parent). */
export const RECLAMATION_STATUT_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_REVISION: 'En révision',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
}
export const RECLAMATION_STATUT_OPTIONS = Object.entries(RECLAMATION_STATUT_LABELS).map(([value, label]) => ({
  value,
  label,
}))
export function reclamationStatutBadgeVariant(statut) {
  if (statut === 'ACCEPTEE') return 'success'
  if (statut === 'REFUSEE') return 'danger'
  if (statut === 'EN_REVISION') return 'warning'
  return 'neutral'
}
