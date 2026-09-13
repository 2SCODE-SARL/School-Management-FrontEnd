import { apiClient } from './client'

const base = '/rbac/roles'

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

/**
 * RBAC — gestion des rôles plateforme (Admin uniquement, pas scopé à un
 * établissement). `CreateRoleDto.code` est un enum fixe des 8 profils du
 * cahier des charges — on ne crée donc pas de rôle "libre", seulement une
 * variante (libellé personnalisé + permissions) d'un des 8 codes existants.
 *
 * Limitation notable : aucun endpoint ne liste l'univers des permissions
 * disponibles (seulement celles déjà associées à un rôle via
 * `GET .../permissions`) — signalé au backend, même famille de lacune que
 * les réductions/délibérations.
 */
export const listRoles = ({ q, actif, page, limit } = {}) => apiClient.get(withQuery(base, { q, actif, page, limit }))
export const createRole = (data) => apiClient.post(base, data)
export const getRole = (id) => apiClient.get(`${base}/${id}`)
/** `UpdateRoleDto` : libelle?, actif? (activer/désactiver). */
export const updateRole = (id, data) => apiClient.patch(`${base}/${id}`, data)
export const getRolePermissions = (id) => apiClient.get(`${base}/${id}/permissions`)
/** `AssignPermissionsDto` : { permissionIds: string[] }. */
export const assignPermissions = (id, permissionIds) => apiClient.post(`${base}/${id}/permissions`, { permissionIds })
export const removeAllPermissions = (id) => apiClient.delete(`${base}/${id}/permissions`)
