export const ROLE_CODE_LABELS = {
  ADMINISTRATEUR: 'Administrateur',
  DIRECTEUR: 'Directeur',
  COMPTABLE: 'Comptable',
  ENSEIGNANT: 'Enseignant',
  SURVEILLANT: 'Surveillant',
  SECRETAIRE: 'Secrétaire',
  PARENT: 'Parent',
  ELEVE: 'Élève',
}
export const ROLE_CODE_OPTIONS = Object.entries(ROLE_CODE_LABELS).map(([value, label]) => ({ value, label }))
