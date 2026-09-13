export const DEMANDE_STATUT_LABELS = {
  OUVERTE: 'Ouverte',
  EN_TRAITEMENT: 'En traitement',
  REPONDUE: 'Répondue',
  CLOTUREE: 'Clôturée',
}
export const DEMANDE_STATUT_OPTIONS = Object.entries(DEMANDE_STATUT_LABELS).map(([value, label]) => ({
  value,
  label,
}))
export function demandeStatutBadgeVariant(statut) {
  if (statut === 'CLOTUREE') return 'neutral'
  if (statut === 'REPONDUE') return 'success'
  if (statut === 'EN_TRAITEMENT') return 'warning'
  return 'primary'
}
