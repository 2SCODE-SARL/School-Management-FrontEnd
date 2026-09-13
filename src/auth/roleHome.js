/** Espace (racine de routes) de chaque rôle une fois connecté. */
const ROLE_HOME_PATH = {
  ADMINISTRATEUR: '/admin',
  DIRECTEUR: '/directeur',
  SURVEILLANT: '/surveillant',
  ENSEIGNANT: '/enseignant',
  SECRETAIRE: '/secretaire',
  COMPTABLE: '/comptable',
  ELEVE: '/eleve',
  PARENT: '/parent',
}

/**
 * `/api/auth/me` renvoie `roles: string[]` (un compte peut potentiellement
 * cumuler plusieurs rôles). On considère le premier comme rôle principal
 * pour la navigation.
 */
export function getPrimaryRole(user) {
  return user?.roles?.[0]
}

export function getHomePathForRole(role) {
  return ROLE_HOME_PATH[role] ?? '/espace-indisponible'
}
