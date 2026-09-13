import { apiClient, tokenStorage } from './client'

/** POST /api/auth/login -> { accessToken, refreshToken } */
export function login(email, password) {
  return apiClient.post('/auth/login', { email, password }, { auth: false })
}

/** GET /api/auth/me -> utilisateur courant (rôle, établissement, etc.) */
export function fetchCurrentUser() {
  return apiClient.get('/auth/me')
}

/** POST /api/auth/logout */
export function logout() {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) return Promise.resolve()
  return apiClient.post('/auth/logout', { refreshToken }).catch(() => {})
}

/**
 * Active un compte parent via le lien reçu par email (`ActivationParentDto`
 * : token + password choisi). Route publique, jeton à usage unique.
 */
export function activateParentAccount(token, password) {
  return apiClient.post('/auth/activation-parent', { token, password }, { auth: false })
}
