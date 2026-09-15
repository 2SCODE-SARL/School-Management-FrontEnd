import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Briefcase, Cake, IdCard, KeyRound, Mail, MapPin, Phone, ShieldCheck, UserCircle2 } from 'lucide-react'
import { getMyProfile } from '../../api/profile'
import { getEtablissement } from '../../api/etablissements'
import { getProfil as getEleveProfil } from '../../api/portailEleve'
import { getEmployeLinkStatus } from '../../api/rh'
import { useAuth } from '../../auth/AuthContext'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { ROLE_LABELS } from '../../config/roles'
import { EMPLOYE_TYPE_LABELS, TYPE_CONTRAT_LABELS } from '../../config/rhLabels'
import { formatDate } from '../../lib/formatDate'
import { pick } from '../../lib/pick'
import { ChangePasswordModal } from './ChangePasswordModal'
import { EditProfileModal } from './EditProfileModal'

// Rôles pour lesquels on peut retrouver le dossier RH (Employé) du compte
// connecté via `GET .../utilisateurs/{utilisateurId}/employe` — seuls ces
// rôles y ont accès côté API (confirmé par le tag Swagger de l'endpoint).
// Enseignant/Comptable/Surveillant n'ont aujourd'hui AUCUN endpoint pour
// consulter leur propre fiche Employé (poste, matricule, contrat) — gap
// backend signalé, voir le fichier de suivi.
const ROLES_AVEC_ACCES_DOSSIER_RH = ['ADMINISTRATEUR', 'DIRECTEUR', 'SECRETAIRE']

/** Petite tuile d'info dans le bandeau coloré — valeur en blanc, libellé discret. */
function InfoTile({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-white truncate">{value || '—'}</p>
    </div>
  )
}

/** Ligne d'info avec icône, réutilisée pour toute la section "Informations personnelles". */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary-600" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink-900 truncate">{value || '—'}</p>
        <p className="text-xs text-ink-400">{label}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user: sessionUser, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['me-profile'],
    queryFn: getMyProfile,
    retry: false,
  })

  // Fusion champ par champ (pas juste "l'un ou l'autre") : `sessionUser`
  // (déjà lui-même une fusion `/auth/me` + `/users/me`, voir AuthContext)
  // sert de base, et cette requête `/users/me` dédiée à la page vient la
  // rafraîchir — sans effacer un champ qu'elle ne renverrait pas (constaté
  // en live : le rôle affiché ici tombait à "—" quand `profile` remplaçait
  // `sessionUser` en bloc au lieu de le compléter).
  const user = { ...sessionUser, ...profile }
  const displayName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || user?.email
  // Tous les rôles du compte (généralement un seul, mais le champ est un
  // tableau côté API) — affichés en badges pour une lecture complète.
  const roleLabels = (user?.roles ?? []).map((r) => ROLE_LABELS[r] ?? r)
  const primaryRole = user?.roles?.[0]
  const roleLabel = ROLE_LABELS[primaryRole] ?? primaryRole ?? '—'

  // `actif` fait partie d'UpdateUserDto mais sa présence sur `GET /users/me`
  // n'est pas confirmée en live — via `pick`, on retombe sur "actif" par
  // défaut (un compte désactivé ne pourrait de toute façon pas se connecter).
  const actif = pick(user, ['actif'], true)
  const statutLabel = actif ? 'Actif' : 'Inactif'

  // `langue`/`fuseauHoraire` existent dans UpdateUserDto — présence en
  // lecture non confirmée non plus, mais l'utilisateur veut voir tous les
  // paramètres du DTO profil ici, donc on les affiche quand même (tiret si
  // absents plutôt que de deviner une valeur).
  const langue = pick(user, ['langue'], null)
  const fuseauHoraire = pick(user, ['fuseauHoraire'], null)

  // Nom/code de l'établissement — champ confirmé (`etablissementId` est
  // présent dans CreateUserDto et déjà utilisé partout ailleurs dans l'app).
  // Absent pour un super-admin sans établissement rattaché — la requête
  // reste alors simplement désactivée.
  const etablissementId = user?.etablissementId
  const { data: etablissement } = useQuery({
    queryKey: ['etablissement', etablissementId],
    queryFn: () => getEtablissement(etablissementId),
    enabled: Boolean(etablissementId),
  })

  // Dossier Élève (`/portail-eleves/me`, correctement typé côté API) —
  // apporte matricule, date/lieu de naissance, sexe, nationalité, statut :
  // aucun de ces champs n'existe sur le compte Utilisateur générique.
  const { data: eleveProfil } = useQuery({
    queryKey: ['portail-eleve', 'profil'],
    queryFn: getEleveProfil,
    enabled: primaryRole === 'ELEVE',
  })

  // Dossier RH (Employé) lié au compte — seuls Admin/Directeur/Secrétaire
  // ont accès à cet endpoint, même pour consulter LEUR PROPRE dossier (voir
  // ROLES_AVEC_ACCES_DOSSIER_RH ci-dessus).
  const { data: employeLink } = useQuery({
    queryKey: ['rh', 'employe-link-status', etablissementId, user?.id],
    queryFn: () => getEmployeLinkStatus(etablissementId, user.id),
    enabled: Boolean(etablissementId && user?.id && ROLES_AVEC_ACCES_DOSSIER_RH.includes(primaryRole)),
  })
  const employe = employeLink?.linked ? employeLink.employe : null

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
                  {roleLabels.length > 0 ? (
                    roleLabels.map((label) => (
                      <Badge key={label} variant="primary">{label}</Badge>
                    ))
                  ) : (
                    <Badge variant="primary">{roleLabel}</Badge>
                  )}
                  <Badge variant={actif ? 'success' : 'danger'}>{actif ? 'Compte actif' : 'Compte inactif'}</Badge>
                </div>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setEditModalOpen(true)} className="shrink-0">
              Modifier le profil
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations personnelles — tous les champs "identité" du DTO profil */}
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Informations personnelles</p>
              <div className="space-y-3">
                <InfoRow icon={UserCircle2} label="Nom" value={user?.nom} />
                <InfoRow icon={UserCircle2} label="Prénom" value={user?.prenom} />
                <InfoRow icon={Mail} label="Adresse e-mail" value={user?.email} />
                <InfoRow icon={Phone} label="Téléphone" value={user?.telephone} />
                <InfoRow icon={MapPin} label="Adresse" value={user?.adresse} />
              </div>
            </div>

            {/* Bandeau coloré — tous les champs "compte" du DTO profil */}
            <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-5">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-4">Informations du compte</p>
              <div className="grid grid-cols-2 gap-4">
                <InfoTile label="Rôle" value={roleLabel} />
                <InfoTile label="Statut" value={statutLabel} />
                <InfoTile label="Établissement" value={etablissement?.nom} />
                <InfoTile label="Code établissement" value={etablissement?.code} />
                <InfoTile label="Langue" value={langue} />
                <InfoTile label="Fuseau horaire" value={fuseauHoraire} />
              </div>
            </div>
          </div>

          {/* Dossier Élève — champs propres à l'inscription, absents du compte Utilisateur générique */}
          {primaryRole === 'ELEVE' && eleveProfil && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Dossier élève</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow icon={IdCard} label="Matricule" value={eleveProfil.matricule} />
                <InfoRow
                  icon={Cake}
                  label="Date et lieu de naissance"
                  value={
                    eleveProfil.dateNaissance
                      ? `${formatDate(eleveProfil.dateNaissance)}${eleveProfil.lieuNaissance ? ` — ${eleveProfil.lieuNaissance}` : ''}`
                      : null
                  }
                />
                <InfoRow icon={UserCircle2} label="Sexe" value={eleveProfil.sexe === 'M' ? 'Masculin' : eleveProfil.sexe === 'F' ? 'Féminin' : null} />
                <InfoRow icon={MapPin} label="Nationalité" value={eleveProfil.nationalite} />
              </div>
            </div>
          )}

          {/* Dossier RH — champs propres à la fiche Employé (poste, contrat), absents du compte Utilisateur générique */}
          {employe && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Dossier RH</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow icon={IdCard} label="Matricule" value={employe.matricule} />
                <InfoRow icon={Briefcase} label="Type de poste" value={EMPLOYE_TYPE_LABELS[employe.type] ?? employe.type} />
                <InfoRow icon={Briefcase} label="Type de contrat" value={TYPE_CONTRAT_LABELS[employe.typeContrat] ?? employe.typeContrat} />
                <InfoRow icon={ShieldCheck} label="Statut du dossier" value={employe.actif ? 'Actif' : 'Inactif'} />
              </div>
            </div>
          )}

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

      <EditProfileModal
        open={isEditModalOpen}
        user={user}
        displayName={displayName}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          setEditModalOpen(false)
          queryClient.invalidateQueries({ queryKey: ['me-profile'] })
          refreshUser()
          setSuccessMessage('Profil mis à jour avec succès.')
          setTimeout(() => setSuccessMessage(''), 4000)
        }}
      />
    </div>
  )
}
