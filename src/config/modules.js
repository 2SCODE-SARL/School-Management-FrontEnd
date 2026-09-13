import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Wallet,
  IdCard,
  FolderOpen,
  MessageSquare,
  Inbox,
  ShieldCheck,
  UserCog,
  Settings,
} from 'lucide-react'

const ADMIN = 'ADMINISTRATEUR'
const DIRECTEUR = 'DIRECTEUR'
const SURVEILLANT = 'SURVEILLANT'
const ENSEIGNANT = 'ENSEIGNANT'
const SECRETAIRE = 'SECRETAIRE'
const COMPTABLE = 'COMPTABLE'
const ELEVE = 'ELEVE'
const PARENT = 'PARENT'

/**
 * Source unique de vérité pour tous les modules de la plateforme.
 *
 * `allowedRoles` reflète EXACTEMENT les tags Swagger (10 — Administrateur /
 * 20 — Directeur), c'est-à-dire ce que le backend vérifie réellement via ses
 * guards `@Roles(...)`. On a d'abord essayé de piloter ça avec le tableau
 * `permissions` de /api/auth/me, mais un test réel a montré qu'un endpoint
 * refusé renvoie "Rôle requis: ADMINISTRATEUR" — la vérification backend est
 * donc bien par rôle, pas par permission. Le tableau `permissions` semble
 * informatif, pas garanti d'être ce qui est appliqué : on ne peut pas s'y
 * fier pour la sécurité de l'interface.
 *
 * `key` sert à construire le chemin final : `${basePath}/${key}`
 * (le dashboard est un cas particulier, sa route est `basePath` lui-même).
 */
export const APP_MODULES = [
  {
    key: 'dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    end: true,
    allowedRoles: [ADMIN, DIRECTEUR, SURVEILLANT, ENSEIGNANT, SECRETAIRE, COMPTABLE, ELEVE, PARENT],
  },
  {
    key: 'etablissements',
    label: 'Établissements',
    icon: Building2,
    allowedRoles: [ADMIN],
  },
  {
    key: 'eleves',
    label: 'Élèves & Inscriptions',
    icon: Users,
    hasChildren: true,
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE],
  },
  {
    key: 'academique',
    label: 'Académique',
    icon: BookOpen,
    hasChildren: true,
    allowedRoles: [ADMIN, DIRECTEUR],
  },
  {
    key: 'emplois-du-temps',
    label: 'Emplois du temps',
    icon: CalendarClock,
    hasChildren: true,
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE, ELEVE],
  },
  {
    key: 'presences',
    label: 'Présences',
    icon: ClipboardCheck,
    allowedRoles: [ADMIN, DIRECTEUR, SURVEILLANT, ENSEIGNANT, ELEVE, PARENT],
  },
  {
    key: 'resultats',
    label: 'Résultats',
    icon: GraduationCap,
    hasChildren: true,
    allowedRoles: [ADMIN, DIRECTEUR, ENSEIGNANT, ELEVE],
  },
  {
    key: 'suivi-scolaire',
    label: 'Suivi scolaire',
    icon: GraduationCap,
    hasChildren: true,
    allowedRoles: [PARENT],
  },
  {
    key: 'mes-documents',
    label: 'Mes documents',
    icon: FolderOpen,
    allowedRoles: [ELEVE],
  },
  {
    key: 'finances',
    label: 'Finances',
    icon: Wallet,
    hasChildren: true,
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE, COMPTABLE],
  },
  {
    key: 'rh',
    label: 'Ressources humaines',
    icon: IdCard,
    hasChildren: true,
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE],
  },
  {
    key: 'documentation',
    label: 'Documentation',
    icon: FolderOpen,
    hasChildren: true,
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE],
  },
  {
    key: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    hasChildren: true,
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE],
  },
  {
    key: 'demandes',
    label: 'Demandes',
    icon: Inbox,
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE, PARENT],
  },
  {
    key: 'roles',
    label: 'Rôles et permissions',
    icon: ShieldCheck,
    allowedRoles: [ADMIN],
  },
  {
    key: 'utilisateurs',
    label: 'Utilisateurs',
    icon: UserCog,
    allowedRoles: [ADMIN, DIRECTEUR],
  },
  {
    key: 'parametrage',
    label: 'Paramétrage',
    icon: Settings,
    allowedRoles: [ADMIN, DIRECTEUR],
  },
]

/** Construit la liste de navigation d'un espace (ex: "/admin", "/directeur"). */
export function getNavigationForSpace(basePath) {
  return APP_MODULES.map((module) => ({
    ...module,
    path: module.key === 'dashboard' ? basePath : `${basePath}/${module.key}`,
  }))
}
