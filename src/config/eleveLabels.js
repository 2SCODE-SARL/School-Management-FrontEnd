export const STATUT_ELEVE_LABELS = {
  PREINSCRIT: 'Préinscrit',
  INSCRIT: 'Inscrit',
  ACTIF: 'Actif',
  ANCIEN: 'Ancien',
  RADIE: 'Radié',
}
export const STATUT_ELEVE_OPTIONS = Object.entries(STATUT_ELEVE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export function statutEleveBadgeVariant(statut) {
  if (statut === 'ACTIF' || statut === 'INSCRIT') return 'success'
  if (statut === 'PREINSCRIT') return 'warning'
  if (statut === 'RADIE') return 'danger'
  return 'neutral'
}

export const SEXE_LABELS = { M: 'Masculin', F: 'Féminin' }
export const SEXE_OPTIONS = Object.entries(SEXE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const PARENT_TYPE_LABELS = { PERE: 'Père', MERE: 'Mère', TUTEUR: 'Tuteur' }
export const PARENT_TYPE_OPTIONS = Object.entries(PARENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

// Statut du DOSSIER d'inscription lui-même — un enum différent de celui de
// l'élève (STATUT_ELEVE_LABELS), confirmé par un 400 listant les valeurs
// acceptées. Le dossier progresse (BROUILLON -> SOUMISE -> COMPLETE ->
// VALIDEE/REFUSEE) indépendamment du statut de l'élève, qui lui passe à
// INSCRIT via "valider".
export const INSCRIPTION_STATUT_LABELS = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Soumise',
  COMPLETE: 'Complète',
  VALIDEE: 'Validée',
  REFUSEE: 'Refusée',
}
export const INSCRIPTION_STATUT_OPTIONS = Object.entries(INSCRIPTION_STATUT_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export function inscriptionStatutBadgeVariant(statut) {
  if (statut === 'VALIDEE') return 'success'
  if (statut === 'REFUSEE') return 'danger'
  if (statut === 'COMPLETE' || statut === 'SOUMISE') return 'warning'
  return 'neutral'
}

// Les transitions sont à sens unique côté backend (confirmé par un 400
// "Transition d'inscription interdite: COMPLETE → SOUMISE") — jamais de
// retour en arrière. REFUSEE reste une sortie possible depuis n'importe
// quel statut non terminal.
const INSCRIPTION_STATUT_ORDER = ['BROUILLON', 'SOUMISE', 'COMPLETE', 'VALIDEE']

/** Statuts qu'on peut légitimement proposer ensuite depuis `statut` (jamais en arrière). */
export function getNextInscriptionStatutOptions(statut) {
  const currentIndex = INSCRIPTION_STATUT_ORDER.indexOf(statut)
  if (statut === 'VALIDEE' || statut === 'REFUSEE') return []
  return INSCRIPTION_STATUT_OPTIONS.filter(({ value }) => {
    if (value === 'REFUSEE') return true
    const index = INSCRIPTION_STATUT_ORDER.indexOf(value)
    return index > currentIndex
  })
}

export const DOCUMENT_STATUT_LABELS = {
  RECU: 'Reçu',
  VERIFIE: 'Vérifié',
  MANQUANT: 'Manquant',
}
export const DOCUMENT_STATUT_OPTIONS = Object.entries(DOCUMENT_STATUT_LABELS).map(
  ([value, label]) => ({ value, label }),
)
export function documentStatutBadgeVariant(statut) {
  if (statut === 'VERIFIE') return 'success'
  if (statut === 'MANQUANT') return 'danger'
  if (statut === 'RECU') return 'warning'
  return 'neutral'
}

export const STATUT_HISTORIQUE_LABELS = {
  NOUVEAU: 'Nouveau',
  ADMIS: 'Admis (passage de classe)',
  REDOUBLANT: 'Redoublant',
  TRANSFERE: 'Transféré',
}
export const STATUT_HISTORIQUE_OPTIONS = Object.entries(STATUT_HISTORIQUE_LABELS).map(
  ([value, label]) => ({ value, label }),
)
