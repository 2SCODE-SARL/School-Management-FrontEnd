// Module Formation (marketplace de cours) — labels confirmés en live au fil
// de l'eau. `verificationStatus` : seule "PENDING_REVIEW" confirmée pour
// l'instant (aucun schéma d'enum documenté côté API) ; les autres sont des
// hypothèses raisonnables à ajuster dès qu'observées réellement.
export const TRAINING_VERIFICATION_STATUS_LABELS = {
  PENDING_REVIEW: 'En attente de vérification',
  UNSUBMITTED: 'Dossier non soumis',
  APPROVED: 'Vérifié',
  REJECTED: 'Rejeté',
  SUSPENDED: 'Suspendu',
}

export function trainingVerificationBadgeVariant(status) {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED' || status === 'SUSPENDED') return 'danger'
  if (status === 'PENDING_REVIEW') return 'warning'
  return 'neutral'
}
