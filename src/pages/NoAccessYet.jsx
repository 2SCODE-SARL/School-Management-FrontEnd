import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getPrimaryRole } from '../auth/roleHome'
import { Button } from '../components/ui/Button'
import { ROLE_LABELS } from '../config/roles'

/** Écran affiché pour un rôle authentifié dont l'espace n'est pas encore construit. */
export default function NoAccessYet() {
  const { user, logout } = useAuth()
  const role = getPrimaryRole(user)

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg shadow-ink-900/5 border border-ink-100 p-10 text-center">
        <h1 className="font-heading text-xl font-bold text-ink-900 mb-2">
          Espace pas encore disponible
        </h1>
        <p className="text-sm text-ink-500 mb-8">
          Ton compte a le rôle « {ROLE_LABELS[role] ?? role} », mais cet espace
          n'a pas encore été construit sur la plateforme.
        </p>
        <Button variant="secondary" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </main>
  )
}
