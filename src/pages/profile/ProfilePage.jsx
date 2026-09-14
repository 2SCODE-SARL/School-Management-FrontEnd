import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react'
import { getMyProfile } from '../../api/profile'
import { useAuth } from '../../auth/AuthContext'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { ROLE_LABELS } from '../../config/roles'
import { pick } from '../../lib/pick'
import { ChangePasswordModal } from './ChangePasswordModal'

/** Petite tuile d'info dans le bandeau coloré — valeur en blanc, libellé discret. */
function InfoTile({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-white truncate">{value || '—'}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { user: sessionUser } = useAuth()
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['me-profile'],
    queryFn: getMyProfile,
    retry: false,
  })

  // Fallback sur les infos déjà connues de la session le temps du chargement.
  const user = profile ?? sessionUser
  const displayName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || user?.email
  const primaryRole = user?.roles?.[0]
  const roleLabel = ROLE_LABELS[primaryRole] ?? primaryRole ?? '—'
  // `langue`/`fuseauHoraire` existent dans le DTO d'édition (UpdateUserDto)
  // mais leur présence sur `GET /users/me` n'est pas confirmée en live —
  // via `pick`, avec un tiret si absents plutôt que de deviner.
  const langue = pick(user, ['langue'], null)
  const fuseauHoraire = pick(user, ['fuseauHoraire'], null)

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">Mon profil</h1>

      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      {isLoading && (
        <div className="p-16 flex justify-center bg-white rounded-2xl border border-ink-100">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="p-8 text-center bg-white rounded-2xl border border-ink-100">
          <p className="text-sm text-danger-600">
            {error?.statusCode ? `Erreur ${error.statusCode} : ` : ''}
            {error?.message || 'Impossible de charger ton profil.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-2xl border border-ink-100 p-6">
          {/* En-tête : photo, nom, badges, bouton Modifier */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
            <div className="flex items-center gap-5">
              <Avatar name={displayName} src={user?.photoUrl} size={88} />
              <div className="min-w-0">
                <p className="font-heading text-xl font-bold text-ink-900 truncate">{displayName}</p>
                <p className="text-sm text-ink-400 mb-2 truncate">{user?.email}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="primary">{roleLabel}</Badge>
                  <Badge variant="success">Compte actif</Badge>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              disabled
              title="Bientôt disponible — en attente d'un endpoint d'auto-édition côté backend"
              className="opacity-60 cursor-not-allowed shrink-0"
            >
              Modifier le profil
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coordonnées */}
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Coordonnées</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-ink-900 truncate">{user?.email || '—'}</p>
                    <p className="text-xs text-ink-400">Adresse e-mail</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-ink-900 truncate">{user?.telephone || '—'}</p>
                    <p className="text-xs text-ink-400">Téléphone</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bandeau coloré — infos de compte */}
            <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-5">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-4">Informations du compte</p>
              <div className="grid grid-cols-2 gap-4">
                <InfoTile label="Rôle" value={roleLabel} />
                <InfoTile label="Statut" value="Actif" />
                <InfoTile label="Langue" value={langue} />
                <InfoTile label="Fuseau horaire" value={fuseauHoraire} />
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 mt-6 bg-ink-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-900">Sécurité</p>
                <p className="text-xs text-ink-500">Change ton mot de passe régulièrement pour sécuriser ton compte.</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setPasswordModalOpen(true)} className="shrink-0">
              <KeyRound className="h-4 w-4" />
              Changer le mot de passe
            </Button>
          </div>
        </div>
      )}

      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => {
          setPasswordModalOpen(false)
          setSuccessMessage('Mot de passe changé avec succès.')
          setTimeout(() => setSuccessMessage(''), 4000)
        }}
      />
    </div>
  )
}
