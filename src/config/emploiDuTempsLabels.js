// 0 = dimanche ... 6 = samedi, comme documenté par CreateCoursDto.jourSemaine.
export const JOUR_SEMAINE_LABELS = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  0: 'Dimanche',
}
export const JOUR_SEMAINE_OPTIONS = Object.entries(JOUR_SEMAINE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const TYPE_ACTIVITE_LABELS = {
  COURS: 'Cours',
  REVISION: 'Révision',
  EVALUATION: 'Évaluation',
  SPORT: 'Sport',
  FESTIF: 'Festif',
  CONFERENCE: 'Conférence',
}
export const TYPE_ACTIVITE_OPTIONS = Object.entries(TYPE_ACTIVITE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// Le champ s'appelle `etat` (confirmé par un vrai payload), pas `statut`
// comme deviné au départ — `ANNULE` confirmé en live, `PLANIFIE`/`TERMINE`
// déduits des résumés d'endpoints ("Terminer un cours planifié").
export const COURS_STATUT_LABELS = {
  PLANIFIE: 'Planifié',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
}
export const COURS_STATUT_OPTIONS = Object.entries(COURS_STATUT_LABELS).map(([value, label]) => ({
  value,
  label,
}))
export function coursStatutBadgeVariant(statut) {
  if (statut === 'TERMINE') return 'success'
  if (statut === 'ANNULE') return 'danger'
  return 'neutral'
}
