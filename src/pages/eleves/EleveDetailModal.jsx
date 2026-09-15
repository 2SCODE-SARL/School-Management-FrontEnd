import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Cake, CheckCircle2, KeyRound, MapPin, Pencil, Phone, Plus, RotateCcw, Trash2, User, UserX } from 'lucide-react'
import {
  annulerRadiationEleve,
  deleteEleve,
  getAccesPortailEleveStatus,
  getEleve,
  provisionAccesPortailEleve,
  radierEleve,
} from '../../api/eleves'
import { resetUserPassword } from '../../api/users'
import {
  createParent,
  demanderRattachement,
  linkParentToEleve,
  provisionAccesPortailParent,
  reinviteAccesPortailParent,
  unlinkParentFromEleve,
} from '../../api/parents'
import { Modal } from '../../components/ui/Modal'
import { Avatar } from '../../components/ui/Avatar'
import { InfoRow } from '../../components/ui/InfoRow'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { PasswordRevealModal } from '../admin/utilisateurs/PasswordRevealModal'
import {
  PARENT_TYPE_LABELS,
  SEXE_LABELS,
  STATUT_ELEVE_LABELS,
  statutEleveBadgeVariant,
} from '../../config/eleveLabels'
import { formatDate } from '../../lib/formatDate'
import { generatePassword } from '../../lib/generatePassword'
import { AddParentForm } from './AddParentForm'
import { LinkExistingParentForm } from './LinkExistingParentForm'
import { RattacherParentPlateformeForm } from './RattacherParentPlateformeForm'
import { AccesPortailEleveForm } from './AccesPortailEleveForm'
import { InscriptionDocuments } from './InscriptionDocuments'

/** Détail d'un élève : infos + parents rattachés (ajout/détachement inclus). */
export function EleveDetailModal({ eleveId, etablissementId, onClose, onEdit }) {
  const [isAddParentOpen, setAddParentOpen] = useState(false)
  const [addParentMode, setAddParentMode] = useState('nouveau') // 'nouveau' | 'existant'
  const [isRadierConfirmOpen, setRadierConfirmOpen] = useState(false)
  const [isAnnulerConfirmOpen, setAnnulerConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isAccesPortailOpen, setAccesPortailOpen] = useState(false)
  const [detachingParentId, setDetachingParentId] = useState(null)
  const [eleveCredentials, setEleveCredentials] = useState(null)
  const queryClient = useQueryClient()

  const accesStatusQueryKey = ['eleves', 'acces-portail-status', etablissementId, eleveId]
  // Nouveau endpoint (ajouté par le backend suite à notre remontée) : on
  // sait enfin AVANT de cliquer si cet élève a déjà un accès portail.
  const { data: accesStatus, isLoading: isLoadingAccesStatus } = useQuery({
    queryKey: accesStatusQueryKey,
    queryFn: () => getAccesPortailEleveStatus(etablissementId, eleveId),
    enabled: Boolean(etablissementId && eleveId),
  })

  const queryKey = ['eleves', 'detail', etablissementId, eleveId]
  const { data: eleve, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getEleve(etablissementId, eleveId),
    enabled: Boolean(eleveId && etablissementId),
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['eleves', 'list'] })
    queryClient.invalidateQueries({ queryKey: accesStatusQueryKey })
  }

  function closeAddParent() {
    setAddParentOpen(false)
    setAddParentMode('nouveau')
  }

  const resetPasswordMutation = useMutation({
    mutationFn: () => {
      const password = generatePassword()
      return resetUserPassword(accesStatus.utilisateur.id, password).then(() => password)
    },
    onSuccess: (password) => setEleveCredentials({ email: accesStatus.utilisateur.email, password }),
  })

  const addParentMutation = useMutation({
    mutationFn: (formData) => createParent(etablissementId, eleveId, formData),
    onSuccess: () => {
      invalidateAll()
      setAddParentOpen(false)
    },
  })

  const linkExistingParentMutation = useMutation({
    mutationFn: (parentId) => linkParentToEleve(parentId, eleveId, etablissementId),
    onSuccess: () => {
      invalidateAll()
      setAddParentOpen(false)
    },
  })

  // Ne rattache pas immédiatement (le parent doit d'abord approuver) : pas
  // d'invalidation ici, et la modale reste ouverte pour afficher la
  // confirmation d'envoi (voir RattacherParentPlateformeForm).
  const demanderRattachementMutation = useMutation({
    mutationFn: ({ email }) => demanderRattachement(etablissementId, { eleveId, email }),
  })

  const detachMutation = useMutation({
    mutationFn: (parentId) => unlinkParentFromEleve(parentId, eleveId),
    onSuccess: () => {
      invalidateAll()
      setDetachingParentId(null)
    },
  })

  // Contrairement à l'élève, `parent.utilisateurId` (déjà présent dans la
  // réponse de GET .../eleves/{id}) permet de savoir si un compte existe
  // déjà — pas besoin de deviner ici.
  const provisionParentMutation = useMutation({
    mutationFn: (parentId) => provisionAccesPortailParent(etablissementId, parentId),
    onSuccess: invalidateAll,
  })
  const reinviteParentMutation = useMutation({
    mutationFn: (parentId) => reinviteAccesPortailParent(etablissementId, parentId),
    onSuccess: invalidateAll,
  })

  const radierMutation = useMutation({
    mutationFn: () => radierEleve(etablissementId, eleveId),
    onSuccess: () => {
      invalidateAll()
      setRadierConfirmOpen(false)
      onClose()
    },
  })

  const annulerRadiationMutation = useMutation({
    mutationFn: () => annulerRadiationEleve(etablissementId, eleveId),
    onSuccess: () => {
      invalidateAll()
      setAnnulerConfirmOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEleve(etablissementId, eleveId),
    onSuccess: () => {
      invalidateAll()
      setDeleteConfirmOpen(false)
      onClose()
    },
  })

  const accesPortailMutation = useMutation({
    mutationFn: (payload) => provisionAccesPortailEleve(etablissementId, eleveId, payload),
    onSuccess: () => {
      invalidateAll()
      setAccesPortailOpen(false)
    },
  })

  const parents = eleve?.parents ?? []
  // `eleve.inscriptions` couvre l'historique (préinscription initiale,
  // réinscriptions les années suivantes...) — on affiche les documents de
  // la plus récente, celle qui reflète le dossier actuel de l'élève.
  const inscriptions = eleve?.inscriptions ?? []
  const latestInscription = inscriptions
    .slice()
    .sort((a, b) => (b.dateInscription ?? b.createdAt ?? '').localeCompare(a.dateInscription ?? a.createdAt ?? ''))[0]

  return (
    <>
      <Modal open={Boolean(eleveId)} onClose={onClose} title="Détail de l'élève">
        {isLoading && (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && (
          <p className="text-sm text-danger-600 text-center py-8">
            Impossible de charger cet élève.
          </p>
        )}
        {eleve && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={`${eleve.prenom ?? ''} ${eleve.nom ?? ''}`.trim()} src={eleve.photoUrl} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-ink-900 truncate">
                  {eleve.prenom} {eleve.nom}
                </p>
                <p className="text-xs text-ink-400">{eleve.matricule ?? '—'}</p>
              </div>
              {eleve.statut && (
                <Badge variant={statutEleveBadgeVariant(eleve.statut)} className="shrink-0">
                  {STATUT_ELEVE_LABELS[eleve.statut] ?? eleve.statut}
                </Badge>
              )}
            </div>

            <div className="mb-2">
              <InfoRow
                icon={Cake}
                label="Date de naissance"
                value={formatDate(eleve.dateNaissance)}
              />
              <InfoRow icon={MapPin} label="Lieu de naissance" value={eleve.lieuNaissance} />
              <InfoRow icon={MapPin} label="Quartier" value={eleve.quartier} />
              <InfoRow icon={User} label="Sexe" value={SEXE_LABELS[eleve.sexe] ?? eleve.sexe} />
              <InfoRow icon={Phone} label="Téléphone" value={eleve.telephone} />
            </div>

            <div className="pt-4 border-t border-ink-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-ink-900">Parents / tuteurs</p>
                <Button size="sm" variant="secondary" onClick={() => setAddParentOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              </div>

              {parents.length === 0 ? (
                <p className="text-sm text-ink-400">Aucun parent rattaché pour l'instant.</p>
              ) : (
                <div className="space-y-2">
                  {parents.map((item, index) => {
                    // La forme exacte n'est pas typée dans la spec : selon
                    // les endpoints déjà vus (ex: rôles utilisateur), le
                    // parent peut être imbriqué sous `.parent` plutôt qu'à
                    // plat — on gère les deux cas pour ne rien afficher de
                    // vide.
                    const parent = item.parent ?? item
                    const parentId = item.parent?.id ?? item.parentId ?? item.id
                    const type = parent.type ?? item.type
                    const hasCompte = Boolean(parent.utilisateurId)
                    return (
                      <div
                        key={parentId ?? index}
                        className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Pas de `photoUrl` confirmé côté Parent (signalé
                              au backend) — initiales en attendant. */}
                          <Avatar name={parent.nomPrenom ?? 'Parent'} src={parent.photoUrl} size={36} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink-900 truncate">
                              {parent.nomPrenom ?? 'Parent'}
                            </p>
                            <p className="text-xs text-ink-400">
                              {PARENT_TYPE_LABELS[type] ?? type ?? '—'}
                              {parent.telephone ? ` · ${parent.telephone}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {hasCompte ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              isLoading={reinviteParentMutation.isPending && reinviteParentMutation.variables === parentId}
                              onClick={() => reinviteParentMutation.mutate(parentId)}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              Renvoyer l'invitation
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              isLoading={provisionParentMutation.isPending && provisionParentMutation.variables === parentId}
                              onClick={() => provisionParentMutation.mutate(parentId)}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              Créer un accès
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDetachingParentId(parentId)}
                            className="text-ink-400 hover:text-danger-600 transition-colors"
                            aria-label="Détacher ce parent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {latestInscription && (
              <div className="pt-4 border-t border-ink-100">
                <p className="text-sm font-medium text-ink-900 mb-3">Documents</p>
                <InscriptionDocuments
                  etablissementId={etablissementId}
                  inscriptionId={latestInscription.id}
                  eleveNom={`${eleve.prenom} ${eleve.nom}`.trim()}
                />
              </div>
            )}

            {(eleve.statut === 'INSCRIT' || eleve.statut === 'ACTIF') && (
              <div className="pt-4 mt-2 border-t border-ink-100">
                {isLoadingAccesStatus ? (
                  <div className="p-3 flex justify-center">
                    <div className="h-5 w-5 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
                  </div>
                ) : accesStatus?.linked ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-ink-600 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-success-600 shrink-0" />
                      <span className="truncate">
                        Accès portail {accesStatus.statut === 'ACTIF' ? 'actif' : (accesStatus.statut ?? '').toLowerCase()} — {accesStatus.utilisateur?.email}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shrink-0"
                      isLoading={resetPasswordMutation.isPending}
                      onClick={() => resetPasswordMutation.mutate()}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Réinitialiser le mot de passe
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-ink-500">Aucun accès au portail élève pour l'instant.</p>
                    <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setAccesPortailOpen(true)}>
                      <KeyRound className="h-3.5 w-3.5" />
                      Créer un accès
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-5 mt-4 border-t border-ink-100">
              <Button
                variant="secondary"
                size="sm"
                className="!text-danger-600"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </Button>
              {eleve.statut === 'RADIE' ? (
                <Button variant="secondary" size="sm" onClick={() => setAnnulerConfirmOpen(true)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Annuler la radiation
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="!text-danger-600"
                  onClick={() => setRadierConfirmOpen(true)}
                >
                  <UserX className="h-3.5 w-3.5" />
                  Radier
                </Button>
              )}
              <Button size="sm" onClick={() => onEdit(eleve)}>
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={isAddParentOpen}
        onClose={closeAddParent}
        title="Ajouter un parent / tuteur"
      >
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setAddParentMode('nouveau')}
            className={[
              'flex-1 min-w-[140px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              addParentMode === 'nouveau' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-ink-200 text-ink-600',
            ].join(' ')}
          >
            Nouveau parent
          </button>
          <button
            type="button"
            onClick={() => setAddParentMode('existant')}
            className={[
              'flex-1 min-w-[140px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              addParentMode === 'existant' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-ink-200 text-ink-600',
            ].join(' ')}
          >
            D'un frère/sœur déjà inscrit
          </button>
          <button
            type="button"
            onClick={() => setAddParentMode('plateforme')}
            className={[
              'flex-1 min-w-[140px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              addParentMode === 'plateforme' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-ink-200 text-ink-600',
            ].join(' ')}
          >
            Déjà sur la plateforme (autre école)
          </button>
        </div>

        {addParentMode === 'nouveau' && (
          <AddParentForm
            isSubmitting={addParentMutation.isPending}
            onCancel={closeAddParent}
            onSubmit={(formData) => addParentMutation.mutateAsync(formData)}
          />
        )}
        {addParentMode === 'existant' && (
          <LinkExistingParentForm
            etablissementId={etablissementId}
            currentEleveId={eleveId}
            isSubmitting={linkExistingParentMutation.isPending}
            onCancel={closeAddParent}
            onSubmit={(parentId) => linkExistingParentMutation.mutateAsync(parentId)}
          />
        )}
        {addParentMode === 'plateforme' && (
          <RattacherParentPlateformeForm
            isSubmitting={demanderRattachementMutation.isPending}
            onCancel={closeAddParent}
            onSubmit={(payload) => demanderRattachementMutation.mutateAsync(payload)}
          />
        )}
      </Modal>

      <Modal open={isAccesPortailOpen} onClose={() => setAccesPortailOpen(false)} title="Créer l'accès au portail élève">
        <AccesPortailEleveForm
          isSubmitting={accesPortailMutation.isPending}
          onCancel={() => setAccesPortailOpen(false)}
          onSubmit={(payload) => accesPortailMutation.mutateAsync(payload)}
        />
      </Modal>

      <PasswordRevealModal
        open={Boolean(eleveCredentials)}
        onClose={() => setEleveCredentials(null)}
        email={eleveCredentials?.email}
        password={eleveCredentials?.password}
      />

      <ConfirmDialog
        open={Boolean(detachingParentId)}
        onClose={() => setDetachingParentId(null)}
        onConfirm={() => detachMutation.mutate(detachingParentId)}
        isLoading={detachMutation.isPending}
        title="Détacher ce parent ?"
        description="Le parent ne sera plus rattaché à cet élève. Sa fiche n'est pas supprimée."
        confirmLabel="Détacher"
      />

      <ConfirmDialog
        open={isRadierConfirmOpen}
        onClose={() => setRadierConfirmOpen(false)}
        onConfirm={() => radierMutation.mutate()}
        isLoading={radierMutation.isPending}
        title="Radier cet élève ?"
        description="L'élève sera marqué comme radié, sans perdre son historique. Réversible via « Annuler la radiation »."
        confirmLabel="Radier"
      />

      <ConfirmDialog
        open={isAnnulerConfirmOpen}
        onClose={() => setAnnulerConfirmOpen(false)}
        onConfirm={() => annulerRadiationMutation.mutate()}
        isLoading={annulerRadiationMutation.isPending}
        variant="primary"
        title="Annuler la radiation ?"
        description="L'élève retrouve son statut antérieur à la radiation."
        confirmLabel="Annuler la radiation"
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Supprimer définitivement cet élève ?"
        description="Contrairement à la radiation, cette action révoque aussi ses accès au portail élève. Elle reste une suppression logique côté serveur, mais traite-la comme irréversible."
        confirmLabel="Supprimer"
      />
    </>
  )
}
