import { translateValidationMessage } from '../lib/translateError'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const ACCESS_TOKEN_KEY = 'ge_access_token'
const REFRESH_TOKEN_KEY = 'ge_refresh_token'

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

/**
 * Erreur normalisée à partir du format ApiErrorResponse du backend
 * ({ success, statusCode, message, path, timestamp }).
 */
export class ApiError extends Error {
  constructor(message, statusCode, details) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }
}

// Un seul rafraîchissement à la fois même si plusieurs requêtes prennent un
// 401 en même temps (plusieurs appels React Query en parallèle) — elles
// attendent toutes la même promesse plutôt que de rafraîchir chacune de
// leur côté.
let refreshPromise = null

async function refreshAccessToken() {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) throw new ApiError('Aucun jeton de rafraîchissement.', 401)

  // Appel direct (pas via request()) pour ne jamais boucler si ce endpoint
  // renvoyait lui-même un 401.
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(payload?.message || 'Session expirée.', response.status, payload)
  }
  const data = payload?.data ?? payload
  tokenStorage.setTokens(data.accessToken, data.refreshToken)
  return data.accessToken
}

/** Session définitivement invalide (refresh échoué) : on renvoie vers la connexion. */
function handleSessionExpired() {
  tokenStorage.clear()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

/**
 * Client fetch minimal : préfixe l'URL de l'API, sérialise le JSON,
 * ajoute le Bearer token et déballe { success, data } -> data.
 *
 * Un 401 sur une requête authentifiée déclenche un rafraîchissement du
 * token (une seule tentative) puis rejoue la requête d'origine — sinon la
 * session est considérée expirée et l'utilisateur est renvoyé au login.
 */
async function request(path, { method = 'GET', body, auth = true, headers = {}, _isRetry = false } = {}) {
  // Un FormData (upload de fichier) doit partir tel quel, avec un
  // Content-Type multipart/form-data + boundary généré par le navigateur —
  // le fixer nous-mêmes à application/json casserait l'upload.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const finalHeaders = isFormData ? { ...headers } : { 'Content-Type': 'application/json', ...headers }

  if (auth) {
    const token = tokenStorage.getAccessToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
  })

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && auth && !_isRetry && tokenStorage.getRefreshToken()) {
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        await refreshPromise
        return request(path, { method, body, auth, headers, _isRetry: true })
      } catch {
        handleSessionExpired()
        throw new ApiError('Session expirée, merci de te reconnecter.', 401, payload)
      }
    }
    if (response.status === 401 && auth) {
      handleSessionExpired()
    }

    // Les messages de validation du backend arrivent en anglais brut
    // (class-validator) — on les traduit au mieux avant de les afficher.
    const message = Array.isArray(payload?.message)
      ? payload.message.map(translateValidationMessage).join(', ')
      : translateValidationMessage(payload?.message) || 'Une erreur est survenue.'
    throw new ApiError(message, response.status, payload)
  }

  // `payload?.data ?? payload` traiterait un `data: null` légitime (ex:
  // "aucun bulletin pour l'instant") comme absent et renverrait le wrapper
  // {success, data} entier à la place — un objet "vérité" qui casse tout
  // code faisant `if (!result)`. On distingue donc "la clé `data` existe"
  // de "elle n'existe pas du tout" (rare, réponse non enveloppée).
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
