export const NIVEAU_LABELS = {
  MATERNELLE: 'Maternelle',
  PRIMAIRE: 'Primaire',
  COLLEGE: 'Collège',
  LYCEE: 'Lycée',
}
export const NIVEAU_OPTIONS = Object.entries(NIVEAU_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const MATIERE_TYPE_LABELS = {
  OBLIGATOIRE: 'Obligatoire',
  OPTIONNEL: 'Optionnelle',
}
export const MATIERE_TYPE_OPTIONS = Object.entries(MATIERE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const SALLE_TYPE_LABELS = {
  CLASSIQUE: 'Salle classique',
  LABORATOIRE: 'Laboratoire',
  INFORMATIQUE: 'Salle informatique',
  BIBLIOTHEQUE: 'Bibliothèque',
  AMPHITHEATRE: 'Amphithéâtre',
}
export const SALLE_TYPE_OPTIONS = Object.entries(SALLE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const TYPE_EVALUATION_CODE_LABELS = {
  DEVOIR: 'Devoir',
  INTERROGATION: 'Interrogation',
  COMPOSITION: 'Composition',
  EXAMEN_BLANC: 'Examen blanc',
  EXAMEN_FINAL: 'Examen final',
}
export const TYPE_EVALUATION_CODE_OPTIONS = Object.entries(TYPE_EVALUATION_CODE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const BAREME_LABELS = {
  SUR_10: 'Note sur 10',
  SUR_20: 'Note sur 20',
}
export const BAREME_OPTIONS = Object.entries(BAREME_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// Statut exact de l'année scolaire non confirmé au-delà de "EN_COURS" (seule
// valeur citée dans la doc, pour l'action "ouvrir") — on affiche la valeur
// brute si elle ne correspond à aucun libellé connu, plutôt que planter.
export const ANNEE_STATUT_LABELS = {
  EN_PREPARATION: 'En préparation',
  EN_COURS: 'En cours',
  CLOTUREE: 'Clôturée',
}
export function anneeStatutBadgeVariant(statut) {
  if (statut === 'EN_COURS') return 'success'
  if (statut === 'CLOTUREE') return 'neutral'
  return 'warning'
}

export const TRIMESTRE_STATUT_LABELS = {
  OUVERT: 'Ouvert',
  CLOTURE: 'Clôturé',
}
export function trimestreStatutBadgeVariant(statut) {
  return statut === 'OUVERT' ? 'success' : 'neutral'
}
