import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Atom,
  Award,
  BookOpen,
  Calculator,
  Compass,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  Palette,
  PenLine,
  Ruler,
  Send,
  Sparkles,
  Star,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getHomePathForRole, getPrimaryRole } from '../auth/roleHome'
import { ApiError } from '../api/client'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { Alert } from '../components/ui/Alert'

// Icônes flottantes du décor — discrètes (basse opacité, mouvement lent et
// de faible amplitude), scolaires par thème. Positions en % pour rester
// cohérentes à toutes les tailles d'écran ; les plus petites/proches du
// centre sont masquées sur mobile pour ne pas gêner la carte de connexion.
const FLOATING_ICONS = [
  { Icon: GraduationCap, style: { top: '14%', left: '9%' }, size: 'h-10 w-10', anim: 'motion-safe:animate-float-a', delay: '0s' },
  { Icon: BookOpen, style: { top: '72%', left: '7%' }, size: 'h-8 w-8', anim: 'motion-safe:animate-float-b', delay: '1.2s' },
  { Icon: PenLine, style: { top: '22%', right: '11%' }, size: 'h-7 w-7', anim: 'motion-safe:animate-float-a', delay: '2.4s' },
  { Icon: Award, style: { top: '68%', right: '9%' }, size: 'h-9 w-9', anim: 'motion-safe:animate-float-b', delay: '0.6s' },
  { Icon: Sparkles, style: { top: '42%', left: '4%' }, size: 'h-6 w-6 hidden sm:block', anim: 'motion-safe:animate-float-a', delay: '3.2s' },
  { Icon: Calculator, style: { top: '8%', right: '28%' }, size: 'h-7 w-7 hidden sm:block', anim: 'motion-safe:animate-float-b', delay: '1.8s' },
  { Icon: Ruler, style: { top: '85%', left: '24%' }, size: 'h-8 w-8 hidden sm:block', anim: 'motion-safe:animate-float-a', delay: '2.8s' },
  { Icon: Atom, style: { top: '10%', left: '30%' }, size: 'h-7 w-7 hidden sm:block', anim: 'motion-safe:animate-float-b', delay: '0.3s' },
  { Icon: FlaskConical, style: { top: '80%', right: '26%' }, size: 'h-7 w-7 hidden sm:block', anim: 'motion-safe:animate-float-a', delay: '1.5s' },
  { Icon: Compass, style: { top: '48%', right: '4%' }, size: 'h-6 w-6', anim: 'motion-safe:animate-float-b', delay: '2.1s' },
  { Icon: Lightbulb, style: { top: '5%', left: '48%' }, size: 'h-6 w-6 hidden sm:block', anim: 'motion-safe:animate-float-a', delay: '3.6s' },
  { Icon: Palette, style: { top: '90%', right: '42%' }, size: 'h-7 w-7 hidden sm:block', anim: 'motion-safe:animate-float-b', delay: '1s' },
  { Icon: Star, style: { top: '58%', left: '2%' }, size: 'h-5 w-5', anim: 'motion-safe:animate-float-a', delay: '4s' },
]

// Avions en papier qui traversent lentement le ciel en diagonale, en boucle
// (24s), décalés dans le temps et en hauteur pour ne jamais se superposer.
const PAPER_PLANES = [
  { style: { top: '30%', left: 0 }, delay: '0s' },
  { style: { top: '52%', left: 0 }, delay: '8s' },
  { style: { top: '74%', left: 0 }, delay: '16s' },
]

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
    <main className="relative min-h-screen overflow-hidden bg-[url('/images/loginBG.png')] bg-cover bg-center bg-ink-50">
      {/* Décor animé, discret : icônes scolaires flottantes + avions en
          papier traversant le ciel. Purement décoratif (aria-hidden,
          pointer-events-none) et respecte prefers-reduced-motion. */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {FLOATING_ICONS.map(({ Icon, style, size, anim, delay }, i) => (
          <Icon
            key={i}
            className={`absolute text-primary-700/10 ${size} ${anim}`}
            style={{ ...style, animationDelay: delay }}
            strokeWidth={1.5}
          />
        ))}
        {PAPER_PLANES.map((plane, i) => (
          <Send
            key={i}
            className="absolute h-6 w-6 text-primary-700/15 motion-safe:animate-drift"
            style={{ ...plane.style, animationDelay: plane.delay }}
            strokeWidth={1.5}
          />
        ))}
      </div>

      {/* Marque de la plateforme, coin haut-gauche */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-ink-900 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-heading font-semibold text-sm text-ink-900">
          Plateforme Écoles
        </span>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
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
