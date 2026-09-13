/**
 * Aucun `GET` ne liste les réductions/bourses créées (seulement créer/
 * modifier, endpoint signalé au backend) — on accumule donc les réductions
 * créées PENDANT la session en cours dans le cache React Query, pour que
 * l'onglet Échéances puisse proposer d'en appliquer une sans redemander
 * son id à l'utilisateur. Ça ne survit pas à un rechargement de page.
 */
export function reductionsSessionKey(etablissementId) {
  return ['finances', 'reductions-session', etablissementId]
}
