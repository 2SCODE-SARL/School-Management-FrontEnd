import { GraduationCap } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'

/**
 * Bannière de bienvenue affichée en tête du tableau de bord principal de
 * chaque espace — même dégradé bleu que la sidebar (voir Sidebar.jsx :
 * from-primary-600 via-primary-700 to-primary-900), pour une identité
 * visuelle cohérente. Illustration décorative : nuages en dégradés flous +
 * tuile flottante, qui affiche la photo du compte connecté quand il en a
 * une (repli sur l'icône générique sinon — même logique que l'Avatar).
 */
export function WelcomeBanner({ name, subtitle = 'Gère ton établissement facilement, jour après jour.' }) {
  const { user } = useAuth()

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-700 to-primary-900 px-6 sm:px-9 py-7 sm:py-9 mb-6">
      {/* Nuages décoratifs */}
      <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="absolute right-10 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="absolute right-24 top-6 h-16 w-16 rounded-full bg-white/10 blur-xl hidden sm:block" aria-hidden="true" />

      {/* Élément flottant : photo circulaire du compte connecté, ou icône générique */}
      {user?.photoUrl ? (
        <img
          src={user.photoUrl}
          alt=""
          aria-hidden="true"
          className="absolute right-8 sm:right-14 top-1/2 -translate-y-1/2 h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover ring-4 ring-white/80 hidden sm:block"
        />
      ) : (
        <div
          className="absolute right-8 sm:right-14 top-1/2 -translate-y-1/2 h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/15 backdrop-blur-sm items-center justify-center rotate-6 hidden sm:flex"
          aria-hidden="true"
        >
          <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={1.5} />
        </div>
      )}

      <div className="relative max-w-md">
        <h2 className="font-heading text-xl sm:text-2xl font-bold !text-white mb-1.5">
          Bienvenue{name ? ` ${name}` : ''} !
        </h2>
        <p className="text-sm text-white/80">{subtitle}</p>
      </div>
    </div>
  )
}
