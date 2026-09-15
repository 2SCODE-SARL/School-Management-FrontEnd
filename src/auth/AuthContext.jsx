import { createContext, useContext, useEffect, useState } from 'react'
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth'
import { getMyProfile } from '../api/profile'
import { tokenStorage } from '../api/client'

const AuthContext = createContext(null)

/**
 * `GET /auth/me` (identité/rôles) et `GET /users/me` (photo, adresse,
 * téléphone...) sont deux endpoints distincts qui ne renvoient pas les
 * mêmes champs — constaté en live : la photo de profil n'apparaît que sur
 * `/users/me`, mais les rôles sont fiables sur `/auth/me`. On les fusionne
 * ici une bonne fois pour toutes pour que TOUT ce qui lit `useAuth().user`
 * (Topbar, Sidebar...) ait la vue la plus complète, pas seulement la page
 * Profil. `/users/me` reste secondaire : un échec ne bloque pas la connexion.
 */
async function loadFullUser() {
  const identity = await fetchCurrentUser()
  const profile = await getMyProfile().catch(() => null)
  return { ...identity, ...profile }
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
