/** Mois 1-12 pour les sélecteurs de période de paie. */
export const MOIS_OPTIONS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
]

export const MOIS_LABEL_BY_NUM = Object.fromEntries(MOIS_OPTIONS.map((m) => [m.value, m.label]))

/**
 * Statut de bulletin de paie — deviné (pas de schéma documenté pour la
 * réponse), sur le même principe que le reste du workflow financier
 * (généré puis payé). À ajuster si le backend renvoie autre chose.
 */
export const PAIE_STATUT_LABELS = {
  GENERE: 'Généré',
  PAYE: 'Payé',
}

export function paieStatutBadgeVariant(statut) {
  if (statut === 'PAYE') return 'success'
  if (statut === 'GENERE') return 'warning'
  return 'neutral'
}

export const TYPE_FRAIS_CODE_LABELS = {
  INSCRIPTION: 'Inscription',
  REINSCRIPTION: 'Réinscription',
  SCOLARITE: 'Scolarité',
  EXAMEN: 'Examen',
  TRANSPORT: 'Transport',
  CANTINE: 'Cantine',
  INTERNAT: 'Internat',
  UNIFORME: 'Uniforme',
  BIBLIOTHEQUE: 'Bibliothèque',
  PARASCOLAIRE: 'Parascolaire',
}
export const TYPE_FRAIS_CODE_OPTIONS = Object.entries(TYPE_FRAIS_CODE_LABELS).map(([value, label]) => ({ value, label }))

export const PERIODICITE_LABELS = {
  PONCTUEL: 'Ponctuel',
  MENSUEL: 'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  ANNUEL: 'Annuel',
}
export const PERIODICITE_OPTIONS = Object.entries(PERIODICITE_LABELS).map(([value, label]) => ({ value, label }))

export const REDUCTION_TYPE_LABELS = {
  BOURSE_TOTALE: 'Bourse totale',
  BOURSE_PARTIELLE: 'Bourse partielle',
  REDUCTION_FAMILIALE: 'Réduction familiale',
  EXONERATION: 'Exonération',
}
export const REDUCTION_TYPE_OPTIONS = Object.entries(REDUCTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))

export const ECHEANCE_STATUT_LABELS = {
  A_PAYER: 'À payer',
  PARTIEL: 'Partiel',
  PAYE: 'Payé',
  EXONERE: 'Exonéré',
  ANNULE: 'Annulé',
}
export const ECHEANCE_STATUT_OPTIONS = Object.entries(ECHEANCE_STATUT_LABELS).map(([value, label]) => ({ value, label }))
export function echeanceStatutBadgeVariant(statut) {
  if (statut === 'PAYE' || statut === 'EXONERE') return 'success'
  if (statut === 'PARTIEL') return 'warning'
  if (statut === 'ANNULE') return 'neutral'
  return 'danger'
}

export const MODE_PAIEMENT_LABELS = {
  ESPECE: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  CARTE: 'Carte',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  TRAITE: 'Traite',
}
export const MODE_PAIEMENT_OPTIONS = Object.entries(MODE_PAIEMENT_LABELS).map(([value, label]) => ({ value, label }))

export const MOBILE_MONEY_FOURNISSEUR_OPTIONS = [
  { value: 'ORANGE', label: 'Orange Money' },
  { value: 'MTN', label: 'MTN Mobile Money' },
  { value: 'WAVE', label: 'Wave' },
]
