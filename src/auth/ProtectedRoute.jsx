import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getHomePathForRole, getPrimaryRole } from './roleHome'

/**
 * Garde d'accès :
 * - non connecté -> /login
 * - connecté mais rôle non autorisé pour cette section -> renvoyé vers SON
 *   propre espace (jamais un simple message caché en front : la route ne
 *   rend même pas le contenu, donc taper l'URL directement ne sert à rien).
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
      </div>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace />
  }

  const hasAccess = !allowedRoles || allowedRoles.some((role) => user?.roles?.includes(role))
  if (!hasAccess) {
    return <Navigate to={getHomePathForRole(getPrimaryRole(user))} replace />
  }

  return children
}
