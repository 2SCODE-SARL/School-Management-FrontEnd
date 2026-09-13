export const TEMPLATE_CODE_LABELS = {
  CHANGEMENT_HORAIRE: 'Changement d\'horaire',
  ABSENCE_PROF: 'Absence enseignant',
  REVISION: 'Révision',
  DEVOIR: 'Devoir',
  REMPLACEMENT: 'Remplacement',
  CONVOCATION: 'Convocation',
  REUNION: 'Réunion',
  PUBLICATION_RESULTAT: 'Publication de résultat',
  RELANCE_IMPAYE: 'Relance impayé',
  RECU_PAIEMENT: 'Reçu de paiement',
  ABSENCE_ELEVE: 'Absence élève',
  RETARD_PAIEMENT: 'Retard de paiement',
  // Nouveau (voir demanderRattachement dans api/parents.js) : envoyé au
  // Parent quand un établissement lui demande d'approuver le rattachement
  // d'un nouvel élève à son compte.
  DEMANDE_RATTACHEMENT_PARENT: 'Demande de rattachement parent',
}
export const TEMPLATE_CODE_OPTIONS = Object.entries(TEMPLATE_CODE_LABELS).map(([value, label]) => ({ value, label }))

export const CANAL_LABELS = {
  SMS: 'SMS',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  IN_APP: 'Dans l\'application',
}
export const CANAL_OPTIONS = Object.entries(CANAL_LABELS).map(([value, label]) => ({ value, label }))

export const NOTIFICATION_STATUT_LABELS = {
  EN_ATTENTE: 'En attente',
  ENVOYEE: 'Envoyée',
  ECHOUEE: 'Échouée',
  LUE: 'Lue',
}
export function notificationStatutBadgeVariant(statut) {
  if (statut === 'ENVOYEE' || statut === 'LUE') return 'success'
  if (statut === 'ECHOUEE') return 'danger'
  return 'warning'
}
