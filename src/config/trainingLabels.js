// Module Formation (marketplace de cours) — labels confirmés en live au fil
// de l'eau. Deux statuts distincts à ne pas confondre :
// - `provider.verificationStatus` (sur le prestataire lui-même) : seule
//   "PENDING_REVIEW" confirmée en live pour l'instant.
// - le statut du DOSSIER de vérification (`GET .../provider-verifications/...`,
//   filtre `status` de la liste admin) : enum confirmée par /api/docs —
//   DRAFT / SUBMITTED / UNDER_REVIEW / APPROVED / REJECTED.
// Les deux vocabulaires sont regroupés ici, un seul des deux s'affichera
// selon le champ lu.
export const TRAINING_VERIFICATION_STATUS_LABELS = {
  PENDING_REVIEW: 'En attente de vérification',
  DRAFT: 'Brouillon (non soumis)',
  SUBMITTED: 'Soumis, en attente de revue',
  UNDER_REVIEW: 'En cours de revue',
  APPROVED: 'Vérifié',
  REJECTED: 'Rejeté',
  SUSPENDED: 'Suspendu',
}

export function trainingVerificationBadgeVariant(status) {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED' || status === 'SUSPENDED') return 'danger'
  if (status === 'DRAFT') return 'neutral'
  if (status === 'PENDING_REVIEW' || status === 'SUBMITTED' || status === 'UNDER_REVIEW') return 'warning'
  return 'neutral'
}

export const TRAINING_VERIFICATION_DOCUMENT_TYPE_LABELS = {
  IDENTITY_DOCUMENT: "Pièce d'identité",
  DIPLOMA: 'Diplôme',
  PROFESSIONAL_CERTIFICATE: 'Certificat professionnel',
  ORGANIZATION_REGISTRATION: "Immatriculation de l'organisme",
  TAX_DOCUMENT: 'Document fiscal',
  LEGAL_REPRESENTATIVE_IDENTITY: 'Identité du représentant légal',
  OTHER: 'Autre',
}
export const TRAINING_VERIFICATION_DOCUMENT_TYPE_OPTIONS = Object.entries(
  TRAINING_VERIFICATION_DOCUMENT_TYPE_LABELS,
).map(([value, label]) => ({ value, label }))
