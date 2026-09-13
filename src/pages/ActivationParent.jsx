import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, GraduationCap, Lock, ShieldCheck } from 'lucide-react'
import { activateParentAccount } from '../api/auth'
import { ApiError } from '../api/client'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { Alert } from '../components/ui/Alert'
import { rules, validate } from '../lib/validate'

/**
 * Page publique atteinte via le lien d'invitation envoyé par email au
 * parent (`?token=...`) — choix du mot de passe pour activer le compte
 * (`ActivationParentDto`). Jeton à usage unique, expire après un délai.
 */
export default function ActivationParent() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(
      { password, confirmPassword },
      {
        password: [rules.required('Le mot de passe est requis.'), rules.minLength(8)],
        confirmPassword: [rules.required('Confirme ton mot de passe.')],
      },
    )
    if (!errors.confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas.'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      await activateParentAccount(token, password)
      setIsDone(true)
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Impossible d\'activer le compte. Vérifiez votre connexion internet.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-[url('/images/loginBG.png')] bg-cover bg-center bg-ink-50">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-ink-900 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-heading font-semibold text-sm text-ink-900">Plateforme Écoles</span>
      </div>

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-ink-900/10 border border-white/60 p-8">
            {!token ? (
              <div className="text-center">
                <p className="font-heading text-lg font-bold text-ink-900 mb-2">Lien invalide</p>
                <p className="text-sm text-ink-500">
                  Ce lien d'activation est incomplet — redemande une invitation au secrétariat de ton établissement.
                </p>
              </div>
            ) : isDone ? (
              <div className="text-center">
                <div className="h-11 w-11 rounded-2xl bg-success-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-5 w-5 text-success-600" />
                </div>
                <p className="font-heading text-lg font-bold text-ink-900 mb-2">Compte activé</p>
                <p className="text-sm text-ink-500 mb-5">
                  Ton compte parent est prêt. Tu peux maintenant te connecter avec ton email et le mot de passe choisi.
                </p>
                <Link to="/login">
                  <Button fullWidth>Aller à la connexion</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-white to-primary-50 border border-ink-100 shadow-sm flex items-center justify-center mb-4">
                    <ShieldCheck className="h-5 w-5 text-primary-600" strokeWidth={2} />
                  </div>
                  <h1 className="font-heading text-xl font-bold text-ink-900">Activer ton compte parent</h1>
                  <p className="text-sm text-ink-500 mt-1.5 max-w-[260px]">
                    Choisis un mot de passe pour accéder à ton espace parent.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <TextField
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe (8 caractères min.)"
                    error={fieldErrors.password}
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-ink-400 hover:text-ink-600 transition-colors"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    }
                  />
                  <TextField
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer le mot de passe"
                    error={fieldErrors.confirmPassword}
                  />

                  {formError && <Alert variant="danger">{formError}</Alert>}

                  <Button type="submit" fullWidth isLoading={isSubmitting}>
                    {isSubmitting ? 'Activation…' : 'Activer mon compte'}
                  </Button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-ink-500 mt-6">
            © {new Date().getFullYear()} Plateforme de Gestion des Écoles
          </p>
        </div>
      </div>
    </main>
  )
}
