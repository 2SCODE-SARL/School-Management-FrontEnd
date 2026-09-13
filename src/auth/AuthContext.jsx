import { createContext, useContext, useEffect, useState } from 'react'
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth'
import { tokenStorage } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'authenticated' | 'guest'

  useEffect(() => {
    const token = tokenStorage.getAccessToken()
    if (!token) {
      setStatus('guest')
      return
    }
    fetchCurrentUser()
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
    const currentUser = await fetchCurrentUser()
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

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>')
  return ctx
}
