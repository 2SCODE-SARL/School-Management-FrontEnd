import { createContext, useContext, useEffect, useState } from 'react'
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth'
import { getMyProfile } from '../api/profile'
import { tokenStorage } from '../api/client'

const AuthContext = createContext(null)

/**
 * `GET /auth/me` (identité/rôles) et `GET /users/me` (photo, adresse,
 * téléphone...) sont deux endpoints distincts qui ne renvoient pas les
 * mêmes champs. ATTENTION : une première version fusionnait l'objet
 * `profile` en bloc par-dessus `identity`, ce qui s'est avéré cassant en
 * live — sur un compte Élève, `/users/me` renvoie un `roles` absent/vide,
 * et l'écrasait par-dessus le `roles` correct de `/auth/me`, cassant la
 * redirection post-connexion ("Espace pas encore disponible", rôle « »).
 * On ne reprend donc de `profile` QUE les champs "profil personnel" qu'il
 * est seul à exposer de façon fiable — jamais `roles`, `id`,
 * `etablissementId` ni rien qui touche à l'autorisation, qui restent
 * exclusivement ceux d'`identity`. `/users/me` reste secondaire : un échec
 * ne bloque pas la connexion.
 */
async function loadFullUser() {
  // En parallèle (pas l'un après l'autre) — sur le staging Render.com,
  // chaque aller-retour peut déjà être lent (cold start) ; les enchaîner
  // doublait inutilement le temps avant que tout l'appli (Topbar inclus,
  // donc le compteur de notifications) ne s'affiche après connexion.
  const [identity, profile] = await Promise.all([fetchCurrentUser(), getMyProfile().catch(() => null)])
  if (!profile) return identity
  return {
    ...identity,
    photoUrl: profile.photoUrl ?? identity.photoUrl,
    adresse: profile.adresse ?? identity.adresse,
    telephone: profile.telephone ?? identity.telephone,
    langue: profile.langue ?? identity.langue,
    fuseauHoraire: profile.fuseauHoraire ?? identity.fuseauHoraire,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'authenticated' | 'guest'

  useEffect(() => {
    const token = tokenStorage.getAccessToken()
    if (!token) {
      setStatus('guest')
      return
    }
    loadFullUser()
      .then((currentUser) => {
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch(() => {
        tokenStorage.clear()
        setStatus('guest')
      })
  }, [])

  async function login(email, password) {
    const { accessToken, refreshToken } = await loginRequest(email, password)
    tokenStorage.setTokens(accessToken, refreshToken)
    const currentUser = await loadFullUser()
    setUser(currentUser)
    setStatus('authenticated')
    return currentUser
  }

  async function logout() {
    await logoutRequest()
    tokenStorage.clear()
    setUser(null)
    setStatus('guest')
  }

  // Recharge le compte connecté sans repasser par le login — utilisé après
  // une auto-édition du profil (photo/téléphone/adresse) pour que le
  // Topbar/Sidebar (qui lisent `useAuth().user`, pas la query "me-profile"
  // de la page Profil) reflètent le changement sans attendre une reconnexion.
  async function refreshUser() {
    const currentUser = await loadFullUser()
    setUser(currentUser)
    return currentUser
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>')
  return ctx
}
