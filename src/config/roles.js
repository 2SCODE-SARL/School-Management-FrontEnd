/** Rôles disponibles (CreateUserDto.roleCode), avec leurs libellés en français. */
export const ROLE_LABELS = {
  ADMINISTRATEUR: 'Administrateur',
  DIRECTEUR: 'Directeur',
  COMPTABLE: 'Comptable',
  ENSEIGNANT: 'Enseignant',
  SURVEILLANT: 'Surveillant général',
  SECRETAIRE: 'Secrétaire',
  PARENT: 'Parent',
  ELEVE: 'Élève',
}

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/**
 * Quels rôles chaque profil a le droit d'assigner à un nouveau compte.
 * Un Directeur ne doit jamais pouvoir créer un compte Directeur ou
 * Administrateur (ni se cloner, ni créer un accès plateforme) — ces rôles
 * n'apparaissent donc même pas dans son formulaire de création.
 */
const ASSIGNABLE_ROLES_BY_ROLE = {
  ADMINISTRATEUR: [
    'ADMINISTRATEUR',
    'DIRECTEUR',
    'COMPTABLE',
    'ENSEIGNANT',
    'SURVEILLANT',
    'SECRETAIRE',
    'PARENT',
    'ELEVE',
  ],
  DIRECTEUR: ['COMPTABLE', 'ENSEIGNANT', 'SURVEILLANT', 'SECRETAIRE'],
}

/** Options de rôle assignables par `currentRole`, prêtes pour un <Select>. */
export function getAssignableRoleOptions(currentRole) {
  const codes = ASSIGNABLE_ROLES_BY_ROLE[currentRole] ?? []
  return codes.map((code) => ({ value: code, label: ROLE_LABELS[code] }))
}
