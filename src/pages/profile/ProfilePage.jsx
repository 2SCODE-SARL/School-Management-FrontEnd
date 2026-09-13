import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, Mail, Pencil, Phone, ShieldCheck } from 'lucide-react'
import { getMyProfile } from '../../api/profile'
import { useAuth } from '../../auth/AuthContext'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { InfoRow } from '../../components/ui/InfoRow'
import { ROLE_LABELS } from '../../config/roles'
import { ChangePasswordModal } from './ChangePasswordModal'

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
  const roleLabel = ROLE_LABELS[user?.roles?.[0]] ?? user?.roles?.[0] ?? '—'

  return (
    <div className="max-w-2xl">
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
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-ink-100">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar name={displayName} src={user?.photoUrl} size={56} />
              <div className="min-w-0">
                <p className="font-heading font-bold text-ink-900 truncate">
                  {displayName}
                </p>
                <Badge variant="primary" className="mt-1">
                  {roleLabel}
                </Badge>
              </div>
            </div>
            <Button
              variant="secondary"
              disabled
              title="Bientôt disponible"
              className="opacity-60 cursor-not-allowed"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
          </div>

          <div className="px-6">
            <InfoRow icon={Mail} label="Adresse e-mail" value={user?.email} />
            <InfoRow icon={Phone} label="Téléphone" value={user?.telephone} />
            <InfoRow icon={ShieldCheck} label="Rôle" value={roleLabel} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-ink-50/60 border-t border-ink-100">
            <div>
              <p className="text-sm font-medium text-ink-900">Sécurité</p>
              <p className="text-xs text-ink-500 mt-0.5">
                Change ton mot de passe régulièrement pour sécuriser ton compte.
              </p>
            </div>
            <Button variant="secondary" onClick={() => setPasswordModalOpen(true)}>
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
