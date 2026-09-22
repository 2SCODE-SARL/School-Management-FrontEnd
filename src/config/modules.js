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
  Layers,
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
    key: 'eleves',
    label: 'Élèves & Inscriptions',
    icon: Users,
    hasChildren: true,
    group: 'academique',
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE],
    children: [
      { key: 'eleves', label: 'Élèves' },
      { key: 'inscriptions', label: 'Inscriptions' },
      { key: 'parents', label: 'Parents' },
      { key: 'types-documents', label: 'Types de documents' },
    ],
  },
  {
    key: 'academique',
    label: 'Académique',
    icon: BookOpen,
    hasChildren: true,
    group: 'academique',
    allowedRoles: [ADMIN, DIRECTEUR],
    children: [
      { key: 'annees', label: 'Années scolaires' },
      { key: 'niveaux', label: 'Niveaux' },
      { key: 'series', label: 'Séries' },
      { key: 'matieres', label: 'Matières' },
      { key: 'salles', label: 'Salles' },
      { key: 'types-evaluation', label: "Types d'évaluation" },
      { key: 'classes', label: 'Classes' },
      { key: 'ponderations', label: 'Pondérations' },
    ],
  },
  {
    key: 'emplois-du-temps',
    label: 'Emplois du temps',
    icon: CalendarClock,
    group: 'academique',
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE, ELEVE],
  },
  {
    key: 'presences',
    label: 'Présences',
    icon: ClipboardCheck,
    group: 'academique',
    allowedRoles: [ADMIN, DIRECTEUR, SURVEILLANT, ENSEIGNANT, ELEVE, PARENT],
  },
  {
    key: 'resultats',
    label: 'Résultats',
    icon: GraduationCap,
    hasChildren: true,
    group: 'academique',
    // ELEVE utilise une page dédiée sans onglets (EleveResultatsPage) — pas
    // de `children` ici pour ce rôle, donc aucun n'est visible et le sous-
    // menu se replie automatiquement sur un lien direct (voir Sidebar.jsx).
    allowedRoles: [ADMIN, DIRECTEUR, ENSEIGNANT, ELEVE],
    children: [
      { key: 'examens', label: 'Examens', allowedRoles: [ADMIN, DIRECTEUR, ENSEIGNANT] },
      { key: 'classements', label: 'Classements', allowedRoles: [ADMIN, DIRECTEUR, ENSEIGNANT] },
      { key: 'appreciations', label: 'Appréciations', allowedRoles: [ADMIN, DIRECTEUR, ENSEIGNANT] },
      { key: 'bulletins', label: 'Bulletins', allowedRoles: [ADMIN, DIRECTEUR] },
      { key: 'deliberations', label: 'Délibérations', allowedRoles: [ADMIN, DIRECTEUR] },
      { key: 'reclamations', label: 'Réclamations', allowedRoles: [ENSEIGNANT] },
    ],
  },
  {
    key: 'suivi-scolaire',
    label: 'Suivi scolaire',
    icon: GraduationCap,
    hasChildren: true,
    group: 'academique',
    allowedRoles: [PARENT],
    children: [
      { key: 'notes', label: 'Notes' },
      { key: 'moyennes', label: 'Moyennes' },
      { key: 'bulletins', label: 'Bulletins' },
    ],
  },
  {
    key: 'mes-documents',
    label: 'Mes documents',
    icon: FolderOpen,
    group: 'academique',
    allowedRoles: [ELEVE],
  },
  {
    key: 'finances',
    label: 'Finances',
    icon: Wallet,
    hasChildren: true,
    group: 'finances',
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE, COMPTABLE],
    children: [
      { key: 'frais', label: 'Frais & Réductions', allowedRoles: [ADMIN, DIRECTEUR] },
      { key: 'echeances', label: 'Échéances', allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE, COMPTABLE] },
      { key: 'impayes', label: 'Impayés', allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE, COMPTABLE] },
      { key: 'encaissements', label: 'Encaissements', allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE, COMPTABLE] },
      { key: 'depenses', label: 'Dépenses', allowedRoles: [ADMIN, DIRECTEUR, COMPTABLE] },
      { key: 'budgets', label: 'Budgets', allowedRoles: [ADMIN, DIRECTEUR, COMPTABLE] },
    ],
  },
  {
    key: 'rh',
    label: 'Ressources humaines',
    icon: IdCard,
    hasChildren: true,
    group: 'finances',
    // COMPTABLE ajouté suite au déplacement de la Paie (ex-Finances) dans ce
    // module : RhPage filtre déjà ses onglets par rôle en interne, seul
    // "Paie" lui est réellement accessible.
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE, COMPTABLE],
    children: [
      { key: 'dashboard', label: 'Tableau de bord', allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE] },
      { key: 'employes', label: 'Employés', allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE] },
      { key: 'paie', label: 'Paie', allowedRoles: [ADMIN, DIRECTEUR, COMPTABLE] },
      { key: 'comptes-en-attente', label: 'Comptes en attente', allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE] },
    ],
  },
  {
    key: 'documentation',
    label: 'Documentation',
    icon: FolderOpen,
    hasChildren: true,
    group: 'gestion',
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE],
    children: [
      { key: 'documents', label: 'Documents' },
      { key: 'modeles', label: 'Modèles' },
      { key: 'import-export', label: 'Import / Export' },
    ],
  },
  {
    key: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    hasChildren: true,
    group: 'gestion',
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE],
    children: [
      { key: 'envoyer', label: 'Envoyer une notification', allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE] },
      { key: 'templates', label: 'Modèles de message', allowedRoles: [ADMIN, DIRECTEUR] },
    ],
  },
  {
    key: 'demandes',
    label: 'Demandes',
    icon: Inbox,
    group: 'gestion',
    allowedRoles: [ADMIN, DIRECTEUR, SECRETAIRE, PARENT],
  },
  {
    key: 'etablissements',
    label: 'Établissements',
    icon: Building2,
    group: 'parametrage',
    allowedRoles: [ADMIN],
  },
  {
    key: 'roles',
    label: 'Rôles et permissions',
    icon: ShieldCheck,
    group: 'parametrage',
    allowedRoles: [ADMIN],
  },
  {
    key: 'utilisateurs',
    label: 'Utilisateurs',
    icon: UserCog,
    group: 'parametrage',
    allowedRoles: [ADMIN, DIRECTEUR],
  },
  {
    key: 'parametrage',
    label: 'Paramétrage',
    icon: Settings,
    group: 'parametrage',
    allowedRoles: [ADMIN, DIRECTEUR],
  },
]

export const MODULE_GROUP_META = {
  academique: { label: 'Académique', icon: BookOpen },
  finances: { label: 'Finances', icon: Wallet },
  gestion: { label: 'Gestion', icon: Layers },
  parametrage: { label: 'Paramétrage', icon: Settings },
}

/** Construit la liste de navigation d'un espace (ex: "/admin", "/directeur"). */
export function getNavigationForSpace(basePath) {
  return APP_MODULES.map((module) => ({
    ...module,
    path: module.key === 'dashboard' ? basePath : `${basePath}/${module.key}`,
  }))
}
