import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * Bloque le rendu d'une route si le rôle de l'utilisateur n'est pas dans
 * `roles` — renvoie vers `fallback`. C'est le rôle (pas une permission
 * déclarative) que le backend vérifie réellement sur ses endpoints.
 */
export function RequireRole({ roles, fallback, children }) {
  const { user } = useAuth()
  const allowed = !roles || roles.some((role) => user?.roles?.includes(role))

  if (!allowed) {
    return <Navigate to={fallback} replace />
  }

  return children
}
