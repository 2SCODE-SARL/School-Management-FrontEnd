import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, Lock, Mail, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getHomePathForRole, getPrimaryRole } from '../auth/roleHome'
import { ApiError } from '../api/client'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { Alert } from '../components/ui/Alert'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const currentUser = await login(email, password)
      const redirectTo =
        location.state?.from?.pathname ?? getHomePathForRole(getPrimaryRole(currentUser))
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Connexion impossible. Vérifiez votre connexion internet.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-[url('/images/loginBG.png')] bg-cover bg-center bg-ink-50">
      {/* Marque de la plateforme, coin haut-gauche */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-ink-900 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-heading font-semibold text-sm text-ink-900">
          Plateforme Écoles
        </span>
      </div>

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-ink-900/10 border border-white/60 p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-white to-primary-50 border border-ink-100 shadow-sm flex items-center justify-center mb-4">
                <LogIn className="h-5 w-5 text-primary-600" strokeWidth={2} />
              </div>
              <h1 className="font-heading text-xl font-bold text-ink-900">
                Connexion à votre espace
              </h1>
              <p className="text-sm text-ink-500 mt-1.5 max-w-[240px]">
                Accédez à la gestion de votre établissement en toute simplicité.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <TextField
                id="email"
                type="email"
                icon={Mail}
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />

              <div>
                <TextField
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-ink-400 hover:text-ink-600 transition-colors"
                      aria-label={
                        showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  }
                />
                <div className="flex justify-end mt-2">
                  <span
                    title="Bientôt disponible"
                    className="text-xs text-ink-400 cursor-not-allowed select-none"
                  >
                    Mot de passe oublié ?
                  </span>
                </div>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Button type="submit" fullWidth isLoading={isSubmitting}>
                {isSubmitting ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-ink-500 mt-6">
            © {new Date().getFullYear()} Plateforme de Gestion des Écoles
          </p>
        </div>
      </div>
    </main>
  )
}
