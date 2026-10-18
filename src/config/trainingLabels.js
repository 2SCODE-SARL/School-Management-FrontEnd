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
  VERIFIED: 'Vérifié', // confirmé en live : valeur réelle sur provider.verificationStatus
  REJECTED: 'Rejeté',
  SUSPENDED: 'Suspendu',
}

export function trainingVerificationBadgeVariant(status) {
  if (status === 'APPROVED' || status === 'VERIFIED') return 'success'
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

// Produits (cours) — enums confirmées par /api/docs (CreateTrainingLearningProductDto).
export const TRAINING_PRODUCT_TYPE_LABELS = {
  ACADEMIC_SUPPORT: 'Soutien scolaire',
  PROFESSIONAL_TRAINING: 'Formation professionnelle',
  EXAM_PREPARATION: "Préparation à un examen",
}
export const TRAINING_PRODUCT_TYPE_OPTIONS = Object.entries(TRAINING_PRODUCT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const TRAINING_NATIONAL_EXAM_TYPE_LABELS = {
  BEPC: 'BEPC',
  BACCALAUREATE: 'Baccalauréat',
  ENTRANCE_COMPETITION: "Concours d'entrée",
}
export const TRAINING_NATIONAL_EXAM_TYPE_OPTIONS = Object.entries(TRAINING_NATIONAL_EXAM_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const TRAINING_PROFESSIONAL_LEVEL_LABELS = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
  EXPERT: 'Expert',
}
export const TRAINING_PROFESSIONAL_LEVEL_OPTIONS = Object.entries(TRAINING_PROFESSIONAL_LEVEL_LABELS).map(
  ([value, label]) => ({ value, label }),
)

// Statut de publication d'un produit — enum confirmée par le filtre `status`
// de `GET /training/products/mine`.
export const TRAINING_PRODUCT_STATUS_LABELS = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis, en attente de revue',
  UNDER_REVIEW: 'En cours de revue',
  APPROVED: 'Approuvé (pas encore publié)',
  REJECTED: 'Rejeté',
  PUBLISHED: 'Publié',
  SUSPENDED: 'Suspendu',
  ARCHIVED: 'Archivé',
}

export function trainingProductStatusBadgeVariant(status) {
  if (status === 'PUBLISHED' || status === 'APPROVED') return 'success'
  if (status === 'REJECTED' || status === 'SUSPENDED') return 'danger'
  if (status === 'DRAFT' || status === 'ARCHIVED') return 'neutral'
  return 'warning'
}
