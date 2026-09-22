import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { RequireRole } from './auth/RequireRole'
import { getHomePathForRole, getPrimaryRole } from './auth/roleHome'
import { AppLayout } from './components/layout/AppLayout'
import Login from './pages/Login'
import ActivationParent from './pages/ActivationParent'
import NoAccessYet from './pages/NoAccessYet'
import AdminDashboard from './pages/admin/AdminDashboard'
import EtablissementsPage from './pages/admin/etablissements/EtablissementsPage'
import UtilisateursPage from './pages/admin/utilisateurs/UtilisateursPage'
import AcademiquePage from './pages/academique/AcademiquePage'
import ElevesPage from './pages/eleves/ElevesPage'
import RhPage from './pages/rh/RhPage'
import EmploisDuTempsPage from './pages/emplois-du-temps/EmploisDuTempsPage'
import PresencesPage from './pages/presences/PresencesPage'
import FinancesPage from './pages/finances/FinancesPage'
import ResultatsPage from './pages/resultats/ResultatsPage'
import DocumentationPage from './pages/documentation/DocumentationPage'
import RolesPage from './pages/roles/RolesPage'
import ParametragePage from './pages/parametrage/ParametragePage'
import DirecteurDashboard from './pages/directeur/DirecteurDashboard'
import SurveillantDashboard from './pages/surveillant/SurveillantDashboard'
import EnseignantDashboard from './pages/enseignant/EnseignantDashboard'
import SecretaireDashboard from './pages/secretaire/SecretaireDashboard'
import ComptableDashboard from './pages/comptable/ComptableDashboard'
import EleveDashboard from './pages/eleve/EleveDashboard'
import EleveEmploiDuTempsPage from './pages/eleve/EmploiDuTempsPage'
import ElevePresencesPage from './pages/eleve/PresencesPage'
import EleveResultatsPage from './pages/eleve/ResultatsPage'
import EleveDocumentsPage from './pages/eleve/DocumentsPage'
import ParentDashboard from './pages/parent/ParentDashboard'
import SuiviScolairePage from './pages/parent/SuiviScolairePage'
import PresencesAccesPage from './pages/parent/PresencesAccesPage'
import ParentDemandesPage from './pages/parent/DemandesPage'
import StaffDemandesPage from './pages/demandes/DemandesPage'
import CommunicationPage from './pages/communication/CommunicationPage'
import PlaceholderPage from './pages/admin/PlaceholderPage'
import ProfilePage from './pages/profile/ProfilePage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import { getNavigationForSpace } from './config/modules'

const adminNavigation = getNavigationForSpace('/admin')
const directeurNavigation = getNavigationForSpace('/directeur')
const surveillantNavigation = getNavigationForSpace('/surveillant')
const enseignantNavigation = getNavigationForSpace('/enseignant')
const secretaireNavigation = getNavigationForSpace('/secretaire')
const comptableNavigation = getNavigationForSpace('/comptable')
const eleveNavigation = getNavigationForSpace('/eleve')
const parentNavigation = getNavigationForSpace('/parent')

// Modules déjà construits pour l'Admin : leur route pointe vers la vraie
// page plutôt que vers le PlaceholderPage générique. Le Directeur n'a pas
// (encore) de module construit — tout passe par PlaceholderPage.
const ADMIN_BUILT_PAGES = {
  '/admin/etablissements': EtablissementsPage,
  '/admin/utilisateurs': UtilisateursPage,
  '/admin/academique': AcademiquePage,
  '/admin/eleves': ElevesPage,
  '/admin/rh': RhPage,
  '/admin/emplois-du-temps': EmploisDuTempsPage,
  '/admin/presences': PresencesPage,
  '/admin/finances': FinancesPage,
  '/admin/resultats': ResultatsPage,
  '/admin/demandes': StaffDemandesPage,
  '/admin/communication': CommunicationPage,
  '/admin/documentation': DocumentationPage,
  '/admin/roles': RolesPage,
  '/admin/parametrage': ParametragePage,
}

// Le Directeur n'a pas Établissements, mais a maintenant Utilisateurs
// (scopé à son propre établissement — géré dans UtilisateursPage elle-même).
const DIRECTEUR_BUILT_PAGES = {
  '/directeur/utilisateurs': UtilisateursPage,
  '/directeur/academique': AcademiquePage,
  '/directeur/eleves': ElevesPage,
  '/directeur/rh': RhPage,
  '/directeur/emplois-du-temps': EmploisDuTempsPage,
  '/directeur/presences': PresencesPage,
  '/directeur/finances': FinancesPage,
  '/directeur/resultats': ResultatsPage,
  '/directeur/demandes': StaffDemandesPage,
  '/directeur/communication': CommunicationPage,
  '/directeur/documentation': DocumentationPage,
  '/directeur/parametrage': ParametragePage,
}

// Le Surveillant n'a que Présences (accès élèves + alertes) — vérifié.
const SURVEILLANT_BUILT_PAGES = {
  '/surveillant/presences': PresencesPage,
}

// L'Enseignant n'a que Présences (présence du personnel) — Résultats reste
// à construire.
const ENSEIGNANT_BUILT_PAGES = {
  '/enseignant/presences': PresencesPage,
  '/enseignant/resultats': ResultatsPage,
}

// Le Secrétaire n'a ni Établissements ni Utilisateurs ni Académique — son
// accès réel (vérifié dans la doc) se limite à Élèves & Inscriptions et à
// une partie de RH (créer une fiche, provisionner un compte). Pour
// Finances, il a Échéances/Impayés/Encaissements (pas Paie/Frais/Dépenses/
// Budgets) — FinancesPage filtre déjà ses onglets par rôle en interne, il
// manquait juste l'enregistrement de la page ici (oubli, la page réelle
// n'était jamais montée malgré le lien visible dans le menu).
const SECRETAIRE_BUILT_PAGES = {
  '/secretaire/eleves': ElevesPage,
  '/secretaire/rh': RhPage,
  '/secretaire/emplois-du-temps': EmploisDuTempsPage,
  '/secretaire/finances': FinancesPage,
  '/secretaire/demandes': StaffDemandesPage,
  '/secretaire/communication': CommunicationPage,
  '/secretaire/documentation': DocumentationPage,
}

// Le Comptable a Finances — module complet (Frais & Réductions, Échéances,
// Impayés, Encaissements, Dépenses, Budgets), vérifié via les tags Swagger
// ("50 — Comptable | Finances") — plus, depuis le déplacement de la Paie,
// un accès à Ressources humaines limité au seul onglet "Paie" (RhPage
// filtre les autres onglets par rôle en interne).
const COMPTABLE_BUILT_PAGES = {
  '/comptable/finances': FinancesPage,
  '/comptable/rh': RhPage,
}

// Portail Élève : lecture seule, endpoints `portail-eleves/me/...`.
const ELEVE_BUILT_PAGES = {
  '/eleve/emplois-du-temps': EleveEmploiDuTempsPage,
  '/eleve/presences': ElevePresencesPage,
  '/eleve/resultats': EleveResultatsPage,
  '/eleve/mes-documents': EleveDocumentsPage,
}

// Portail Parent : mes enfants (notes/bulletins/présences/accès) +
// demandes (certificat, correction, congé...) — endpoints `portail-parents/...`.
const PARENT_BUILT_PAGES = {
  '/parent/suivi-scolaire': SuiviScolairePage,
  '/parent/presences': PresencesAccesPage,
  '/parent/demandes': ParentDemandesPage,
}

/**
 * Génère les <Route> enfants d'un espace à partir de la config des modules.
 * Chaque route est protégée par le rôle réellement requis côté backend :
 * même en tapant l'URL directement, un utilisateur au rôle non autorisé est
 * renvoyé à l'accueil de son espace sans que la page ne se monte.
 */
function buildModuleRoutes(navigation, basePath, builtPages = {}) {
  return navigation
    .filter((item) => item.path !== basePath)
    .map((item) => {
      const Page = builtPages[item.path]
      return (
        <Route
          key={item.path}
          path={item.path.replace(`${basePath}/`, '')}
          element={
            <RequireRole roles={item.allowedRoles} fallback={basePath}>
              {Page ? <Page /> : <PlaceholderPage title={item.label} />}
            </RequireRole>
          }
        />
      )
    })
}

/** Racine "/" et routes inconnues : renvoie chacun vers son propre espace. */
function HomeRedirect() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
      </div>
    )
  }

  if (status === 'guest') return <Navigate to="/login" replace />

  return <Navigate to={getHomePathForRole(getPrimaryRole(user))} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/activation-parent" element={<ActivationParent />} />
      <Route path="/espace-indisponible" element={<NoAccessYet />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRATEUR']}>
            <AppLayout navigation={adminNavigation} subtitle="Espace Administrateur" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        {buildModuleRoutes(adminNavigation, '/admin', ADMIN_BUILT_PAGES)}
      </Route>

      <Route
        path="/directeur"
        element={
          <ProtectedRoute allowedRoles={['DIRECTEUR']}>
            <AppLayout navigation={directeurNavigation} subtitle="Espace Directeur" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DirecteurDashboard />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        {buildModuleRoutes(directeurNavigation, '/directeur', DIRECTEUR_BUILT_PAGES)}
      </Route>

      <Route
        path="/surveillant"
        element={
          <ProtectedRoute allowedRoles={['SURVEILLANT']}>
            <AppLayout navigation={surveillantNavigation} subtitle="Espace Surveillant" />
          </ProtectedRoute>
        }
      >
        <Route index element={<SurveillantDashboard />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        {buildModuleRoutes(surveillantNavigation, '/surveillant', SURVEILLANT_BUILT_PAGES)}
      </Route>

      <Route
        path="/enseignant"
        element={
          <ProtectedRoute allowedRoles={['ENSEIGNANT']}>
            <AppLayout navigation={enseignantNavigation} subtitle="Espace Enseignant" />
          </ProtectedRoute>
        }
      >
        <Route index element={<EnseignantDashboard />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        {buildModuleRoutes(enseignantNavigation, '/enseignant', ENSEIGNANT_BUILT_PAGES)}
      </Route>

      <Route
        path="/secretaire"
        element={
          <ProtectedRoute allowedRoles={['SECRETAIRE']}>
            <AppLayout navigation={secretaireNavigation} subtitle="Espace Secrétaire" />
          </ProtectedRoute>
        }
      >
        <Route index element={<SecretaireDashboard />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        {buildModuleRoutes(secretaireNavigation, '/secretaire', SECRETAIRE_BUILT_PAGES)}
      </Route>

      <Route
        path="/comptable"
        element={
          <ProtectedRoute allowedRoles={['COMPTABLE']}>
            <AppLayout navigation={comptableNavigation} subtitle="Espace Comptable" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ComptableDashboard />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        {buildModuleRoutes(comptableNavigation, '/comptable', COMPTABLE_BUILT_PAGES)}
      </Route>

      <Route
        path="/eleve"
        element={
          <ProtectedRoute allowedRoles={['ELEVE']}>
            <AppLayout navigation={eleveNavigation} subtitle="Espace Élève" />
          </ProtectedRoute>
        }
      >
        <Route index element={<EleveDashboard />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        {buildModuleRoutes(eleveNavigation, '/eleve', ELEVE_BUILT_PAGES)}
      </Route>

      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={['PARENT']}>
            <AppLayout navigation={parentNavigation} subtitle="Espace Parent" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ParentDashboard />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        {buildModuleRoutes(parentNavigation, '/parent', PARENT_BUILT_PAGES)}
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}

export default App
