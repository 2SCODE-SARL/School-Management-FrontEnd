import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  IdCard,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Power,
  Trash2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getEmployeLinkStatus } from '../../../api/rh'
import { Modal } from '../../../components/ui/Modal'
import { InfoRow } from '../../../components/ui/InfoRow'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Avatar } from '../../../components/ui/Avatar'
import { ROLE_LABELS } from '../../../config/roles'
import { EMPLOYE_TYPE_LABELS } from '../../../config/rhLabels'
import { formatDateTime as formatDate } from '../../../lib/formatDate'

// Seuls ces rôles ont une fiche RH/paie derrière leur compte — Admin
// plateforme, Parent et Élève n'en déclenchent jamais la création
// (message backend explicite là-dessus).
const PERSONNEL_ROLES = ['DIRECTEUR', 'ENSEIGNANT', 'SECRETAIRE', 'COMPTABLE', 'SURVEILLANT']

/** Vue détaillée d'un utilisateur, avec les actions à portée de main en bas. */
export function UserDetailModal({
  user,
  onClose,
  onEdit,
  onResetPassword,
  onToggleActive,
  onDelete,
  onRattacherEmploye,
  isTogglingActive,
  isResettingPassword,
}) {
  const displayName = user ? `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() : ''
  const roleCode = user?.roles?.[0]?.role?.code
  const roleLabel = ROLE_LABELS[roleCode] ?? user?.roles?.[0]?.role?.libelle ?? '—'
  const isPersonnel = PERSONNEL_ROLES.includes(roleCode)
  const etablissementId = user?.etablissementId ?? user?.etablissement?.id

  // Nouveau endpoint (ajouté par le backend suite à notre remontée) : on
  // sait enfin AVANT de cliquer si ce compte a déjà un dossier employé.
  const { data: linkStatus, isLoading: isLoadingLinkStatus } = useQuery({
    queryKey: ['rh', 'employe-link-status', etablissementId, user?.id],
    queryFn: () => getEmployeLinkStatus(etablissementId, user.id),
    enabled: Boolean(isPersonnel && etablissementId && user?.id),
  })

  return (
    <Modal open={Boolean(user)} onClose={onClose} title="Détail de l'utilisateur">
      {user && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={displayName} src={user.photoUrl} size={48} />
            <div className="min-w-0 flex-1">
              <p className="font-heading font-bold text-ink-900 truncate">
                {displayName}
              </p>
              <Badge variant="primary" className="mt-1">
                {roleLabel}
              </Badge>
            </div>
            <Badge variant={user.actif ? 'success' : 'danger'} className="shrink-0">
              {user.actif ? 'Actif' : 'Inactif'}
            </Badge>
          </div>

          <div>
            <InfoRow icon={Mail} label="Adresse e-mail" value={user.email} />
            <InfoRow icon={Phone} label="Téléphone" value={user.telephone} />
            {user.etablissement && (
              <InfoRow
                icon={Building2}
                label="Établissement"
                value={user.etablissement.nom}
              />
            )}
            <InfoRow
              icon={Clock}
              label="Dernière connexion"
              value={formatDate(user.derniereConnexion)}
            />
            <InfoRow
              icon={Calendar}
              label="Compte créé le"
              value={formatDate(user.createdAt)}
            />
          </div>

          {isPersonnel && (
            <div className="pt-4 mt-2 border-t border-ink-100">
              {isLoadingLinkStatus ? (
                <div className="p-3 flex justify-center">
                  <div className="h-5 w-5 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
                </div>
              ) : linkStatus?.linked ? (
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <CheckCircle2 className="h-4 w-4 text-success-600 shrink-0" />
                  Dossier RH déjà lié — {linkStatus.employe?.prenom} {linkStatus.employe?.nom} (
                  {EMPLOYE_TYPE_LABELS[linkStatus.employe?.type] ?? linkStatus.employe?.type}, {linkStatus.employe?.matricule})
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-500">
                    Aucun dossier RH pour ce compte (les nouveaux comptes en ont un auto-généré — celui-ci a été créé avant cette automatisation).
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => onRattacherEmploye(user)}>
                    <IdCard className="h-3.5 w-3.5" />
                    Créer le dossier employé
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-5 mt-2 border-t border-ink-100">
            <Button
              variant="secondary"
              size="sm"
              className="!text-danger-600"
              onClick={() => onDelete(user)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </Button>
            <Button
              variant="secondary"
              size="sm"
              isLoading={isTogglingActive}
              onClick={() => onToggleActive(user)}
            >
              <Power className="h-3.5 w-3.5" />
              {user.actif ? 'Désactiver' : 'Activer'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              isLoading={isResettingPassword}
              onClick={() => onResetPassword(user)}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
            <Button size="sm" onClick={() => onEdit(user)}>
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
