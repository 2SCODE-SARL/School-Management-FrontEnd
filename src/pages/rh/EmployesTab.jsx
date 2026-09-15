import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, FileText, IdCard, KeyRound, Pencil, Plus, Power, Search, Trash2, UserCheck, Wallet } from 'lucide-react'
import {
  assignMatiereEmploye,
  createContrat,
  createEmploye,
  deleteEmploye,
  getEmploye,
  listComptesEnAttente,
  listContrats,
  provisionnerCompteEmploye,
  removeMatiereEmploye,
  searchEmployes,
  setContratStatut,
  setDossierPaieEtat,
  setEmployeActif,
  updateEmploye,
} from '../../api/rh'
import { listMatieres } from '../../api/academique'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { InfoRow } from '../../components/ui/InfoRow'
import { Pagination } from '../../components/ui/Pagination'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  CONTRAT_STATUT_LABELS,
  CONTRAT_TYPE_LABELS,
  DOSSIER_PAIE_ETAT_LABELS,
  EMPLOYE_TYPE_LABELS,
  EMPLOYE_TYPE_OPTIONS,
  TYPE_CONTRAT_LABELS,
  contratStatutBadgeVariant,
  dossierPaieEtatBadgeVariant,
} from '../../config/rhLabels'
import { formatDate } from '../../lib/formatDate'
import { pick } from '../../lib/pick'
import { EmployeForm } from './EmployeForm'
import { ProvisionnerCompteForm } from './ProvisionnerCompteForm'
import { ContratForm } from './ContratForm'

const TYPE_FILTER_OPTIONS = [{ value: '', label: 'Tous les types' }, ...EMPLOYE_TYPE_OPTIONS]

const PAGE_SIZE = 20

/**
 * Fiches Employé (RH) : le dossier de référence pour toute personne
 * travaillant à l'école (contrat, salaire...). Le compte de connexion peut
 * être créé en même temps (EmployeForm) ou provisionné plus tard depuis le
 * détail (ProvisionnerCompteForm) — `utilisateurId` indique s'il en a déjà un.
 * Pas d'édition possible côté API pour la fiche elle-même : création +
 * liste + activer/désactiver.
 *
 * `searchEmployes` fusionne jusqu'à 3 appels (un par type) quand aucun
 * filtre n'est choisi — la pagination serveur (page/limit, pourtant
 * supportée par l'API) ne peut donc pas s'appliquer proprement à cette
 * liste fusionnée. Pagination côté client à la place : correcte dans
 * tous les cas, au prix de charger la liste complète en mémoire.
 */
export function EmployesTab({ etablissementId, canManageComptes, canViewComptesEnAttente }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [viewingEmploye, setViewingEmploye] = useState(null)
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isProvisionOpen, setProvisionOpen] = useState(false)
  const [isAssignMatiereOpen, setAssignMatiereOpen] = useState(false)
  const [matiereToAssign, setMatiereToAssign] = useState('')
  const [removingMatiereId, setRemovingMatiereId] = useState(null)
  const [isContratOpen, setContratOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(search)
  const queryClient = useQueryClient()

  // Pour afficher "Non validé" plutôt que "Lié" quand un compte est encore
  // en attente — accessible en lecture au Secrétaire depuis peu.
  const { data: enAttenteData } = useQuery({
    queryKey: ['rh', 'comptes-en-attente', etablissementId],
    queryFn: () => listComptesEnAttente(etablissementId),
    enabled: Boolean(etablissementId) && Boolean(canViewComptesEnAttente),
  })
  const comptesEnAttenteIds = new Set(
    (Array.isArray(enAttenteData) ? enAttenteData : (enAttenteData?.items ?? [])).map(
      (item) => item.utilisateurId ?? item.id,
    ),
  )
  function compteStatusFor(employe) {
    if (!employe.utilisateurId) return { label: 'Aucun', variant: 'neutral' }
    if (comptesEnAttenteIds.has(employe.utilisateurId)) return { label: 'Non validé', variant: 'warning' }
    return { label: 'Lié', variant: 'primary' }
  }

  const { data: matieresData } = useQuery({
    queryKey: ['academique', 'matieres', etablissementId],
    queryFn: () => listMatieres(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const allMatieres = Array.isArray(matieresData) ? matieresData : (matieresData?.items ?? [])
  const matiereLabelById = Object.fromEntries(allMatieres.map((m) => [m.id, m.intitule]))

  const queryKey = ['rh', 'employes', etablissementId, { q: debouncedSearch, type: typeFilter }]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => searchEmployes(etablissementId, { q: debouncedSearch, type: typeFilter }),
    enabled: Boolean(etablissementId),
  })
  const employes = Array.isArray(data) ? data : (data?.items ?? [])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, typeFilter, etablissementId])

  const totalPages = Math.max(1, Math.ceil(employes.length / PAGE_SIZE))
  const pagedEmployes = employes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['rh', 'employes', etablissementId] })
  }

  const createMutation = useMutation({
    mutationFn: (payload) => createEmploye(etablissementId, payload),
    onSuccess: () => {
      invalidateAll()
      setCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload) => updateEmploye(etablissementId, viewingEmploye.id, payload),
    onSuccess: (_data, payload) => {
      invalidateAll()
      setEditOpen(false)
      setViewingEmploye((current) => (current ? { ...current, ...payload } : current))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEmploye(etablissementId, viewingEmploye.id),
    onSuccess: () => {
      invalidateAll()
      setDeleteConfirmOpen(false)
      setViewingEmploye(null)
    },
  })

  const toggleActifMutation = useMutation({
    mutationFn: ({ id, actif }) => setEmployeActif(etablissementId, id, actif),
    onSuccess: (_data, variables) => {
      invalidateAll()
      setViewingEmploye((current) =>
        current?.id === variables.id ? { ...current, actif: variables.actif } : current,
      )
    },
  })

  const provisionMutation = useMutation({
    mutationFn: (payload) => provisionnerCompteEmploye(etablissementId, viewingEmploye.id, payload),
    onSuccess: () => {
      invalidateAll()
      setProvisionOpen(false)
      // On ne connaît pas encore le nouveau utilisateurId sans refetch,
      // mais on sait qu'un compte existe désormais.
      setViewingEmploye((current) => (current ? { ...current, utilisateurId: 'pending' } : current))
    },
  })

  const assignMatiereMutation = useMutation({
    mutationFn: (matiereId) => assignMatiereEmploye(etablissementId, viewingEmploye.id, matiereId),
    onSuccess: (_data, matiereId) => {
      invalidateAll()
      setAssignMatiereOpen(false)
      setMatiereToAssign('')
      setViewingEmploye((current) =>
        current ? { ...current, matieres: [...(current.matieres ?? []), { matiereId }] } : current,
      )
    },
  })

  const removeMatiereMutation = useMutation({
    mutationFn: (matiereId) => removeMatiereEmploye(etablissementId, viewingEmploye.id, matiereId),
    onSuccess: (_data, matiereId) => {
      invalidateAll()
      setRemovingMatiereId(null)
      setViewingEmploye((current) =>
        current
          ? {
              ...current,
              matieres: (current.matieres ?? []).filter(
                (m) => (m.matiereId ?? m.matiere?.id ?? m.id ?? m) !== matiereId,
              ),
            }
          : current,
      )
    },
  })

  // Contrat & DossierPaie (nouvelle notion backend) : la fiche renvoyée par
  // la LISTE (searchEmployes) n'inclut probablement pas `dossierPaie` — on
  // refetch un détail frais dès qu'on ouvre la fiche pour l'avoir à jour.
  const contratsQueryKey = ['rh', 'contrats', etablissementId, viewingEmploye?.id]
  const { data: employeDetail } = useQuery({
    queryKey: ['rh', 'employe-detail', etablissementId, viewingEmploye?.id],
    queryFn: () => getEmploye(etablissementId, viewingEmploye.id),
    enabled: Boolean(etablissementId && viewingEmploye?.id),
  })
  const { data: contratsData } = useQuery({
    queryKey: contratsQueryKey,
    queryFn: () => listContrats(etablissementId, viewingEmploye.id),
    enabled: Boolean(etablissementId && viewingEmploye?.id) && canManageComptes,
  })
  const contrats = Array.isArray(contratsData) ? contratsData : (contratsData?.items ?? [])
  const dossierPaieEtat = pick(employeDetail, ['dossierPaie'], null)?.etat ?? null

  function invalidateContrats() {
    queryClient.invalidateQueries({ queryKey: contratsQueryKey })
    queryClient.invalidateQueries({ queryKey: ['rh', 'employe-detail', etablissementId, viewingEmploye?.id] })
  }

  const createContratMutation = useMutation({
    mutationFn: (payload) => createContrat(etablissementId, payload),
    onSuccess: () => {
      invalidateContrats()
      setContratOpen(false)
    },
  })

  const contratStatutMutation = useMutation({
    mutationFn: ({ contratId, statut }) => setContratStatut(etablissementId, contratId, statut),
    onSuccess: invalidateContrats,
  })

  const dossierPaieMutation = useMutation({
    mutationFn: () => setDossierPaieEtat(etablissementId, viewingEmploye.id, 'ACTIF'),
    onSuccess: invalidateContrats,
  })

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvel employé
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        <div className="p-4 border-b border-ink-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom..."
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
            />
          </div>
          <Select
            id="filter-type"
            options={TYPE_FILTER_OPTIONS}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-48"
          />
        </div>

        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les employés." />}
        {!isLoading && !isError && employes.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <IdCard className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun employé pour le moment.
          </div>
        )}
        {!isLoading && !isError && employes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Employé</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Contrat</th>
                  <th className="px-4 py-3 font-medium">Embauché le</th>
                  <th className="px-4 py-3 font-medium">Compte</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {pagedEmployes.map((employe) => (
                  <tr
                    key={employe.id}
                    onClick={() => setViewingEmploye(employe)}
                    className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {employe.prenom} {employe.nom}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {EMPLOYE_TYPE_LABELS[employe.type] ?? employe.type ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {TYPE_CONTRAT_LABELS[employe.typeContrat] ?? employe.typeContrat ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(employe.dateEmbauche)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={compteStatusFor(employe).variant}>{compteStatusFor(employe).label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={employe.actif === false ? 'danger' : 'success'}>
                        {employe.actif === false ? 'Inactif' : 'Actif'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && employes.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} total={employes.length} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Nouvel employé">
        <EmployeForm
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(values) => createMutation.mutateAsync(values)}
        />
      </Modal>

      <Modal open={Boolean(viewingEmploye)} onClose={() => setViewingEmploye(null)} title="Détail de l'employé">
        {viewingEmploye && (
          <>
            <div>
              <InfoRow icon={IdCard} label="Nom complet" value={`${viewingEmploye.prenom} ${viewingEmploye.nom}`} />
              <InfoRow icon={IdCard} label="Type" value={EMPLOYE_TYPE_LABELS[viewingEmploye.type] ?? viewingEmploye.type} />
              <InfoRow icon={IdCard} label="Contrat" value={TYPE_CONTRAT_LABELS[viewingEmploye.typeContrat] ?? viewingEmploye.typeContrat} />
              <InfoRow icon={IdCard} label="Date d'embauche" value={formatDate(viewingEmploye.dateEmbauche)} />
              <InfoRow icon={IdCard} label="Salaire de base" value={viewingEmploye.salaireBase ? `${viewingEmploye.salaireBase} GNF` : null} />
              <InfoRow icon={IdCard} label="Heures max / semaine" value={viewingEmploye.maxHeuresHebdo} />
            </div>

            {canManageComptes && (
              <div className="pt-4 mt-2 border-t border-ink-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink-900">Contrat &amp; Paie</p>
                  <Button size="sm" variant="secondary" onClick={() => setContratOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Nouveau contrat
                  </Button>
                </div>

                {contrats.length === 0 ? (
                  <p className="text-sm text-ink-400 mb-3">
                    Aucun contrat pour l'instant — requis avant de pouvoir activer le dossier de paie.
                  </p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {contrats.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-ink-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-ink-900 truncate">
                              {CONTRAT_TYPE_LABELS[c.type] ?? c.type} · {c.salaire ? `${c.salaire} GNF` : '—'}
                            </p>
                            <p className="text-xs text-ink-400 truncate">
                              {formatDate(c.dateDebut)} → {c.dateFin ? formatDate(c.dateFin) : 'en cours'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={contratStatutBadgeVariant(c.statut)}>
                            {CONTRAT_STATUT_LABELS[c.statut] ?? c.statut}
                          </Badge>
                          {c.statut === 'ACTIF' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              isLoading={contratStatutMutation.isPending}
                              onClick={() => contratStatutMutation.mutate({ contratId: c.id, statut: 'TERMINE' })}
                            >
                              Terminer
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wallet className="h-4 w-4 text-ink-400 shrink-0" />
                    <span className="text-sm text-ink-700">Dossier de paie</span>
                    {dossierPaieEtat && (
                      <Badge variant={dossierPaieEtatBadgeVariant(dossierPaieEtat)}>
                        {DOSSIER_PAIE_ETAT_LABELS[dossierPaieEtat] ?? dossierPaieEtat}
                      </Badge>
                    )}
                  </div>
                  {dossierPaieEtat === 'A_COMPLETER' && (
                    <Button
                      size="sm"
                      isLoading={dossierPaieMutation.isPending}
                      onClick={() => dossierPaieMutation.mutate()}
                    >
                      Activer
                    </Button>
                  )}
                </div>
              </div>
            )}

            {viewingEmploye.type === 'ENSEIGNANT' && (
              <div className="pt-4 mt-2 border-t border-ink-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink-900">Matières habilitées</p>
                  {canManageComptes && (
                    <Button size="sm" variant="secondary" onClick={() => setAssignMatiereOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter
                    </Button>
                  )}
                </div>
                <p className="text-xs text-ink-400 mb-3">
                  Requis avant de pouvoir l'affecter à cette matière dans une classe
                  (sinon "n'est pas habilité pour cette matière").
                </p>
                {(viewingEmploye.matieres ?? []).length === 0 ? (
                  <p className="text-sm text-ink-400">Aucune matière habilitée pour l'instant.</p>
                ) : (
                  <div className="space-y-2">
                    {(viewingEmploye.matieres ?? []).map((item, index) => {
                      const matiereId = item.matiereId ?? item.matiere?.id ?? item.id ?? item
                      return (
                        <div
                          key={matiereId ?? index}
                          className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <BookOpen className="h-4 w-4 text-ink-400 shrink-0" />
                            <span className="text-sm text-ink-900 truncate">
                              {matiereLabelById[matiereId] ?? item.intitule ?? 'Matière'}
                            </span>
                          </div>
                          {canManageComptes && (
                            <button
                              type="button"
                              onClick={() => setRemovingMatiereId(matiereId)}
                              className="text-ink-400 hover:text-danger-600 transition-colors shrink-0"
                              aria-label="Retirer cette matière"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-ink-100">
              {viewingEmploye.utilisateurId ? (
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <UserCheck
                    className={`h-4 w-4 ${compteStatusFor(viewingEmploye).variant === 'warning' ? 'text-warning-500' : 'text-success-600'}`}
                  />
                  {compteStatusFor(viewingEmploye).variant === 'warning'
                    ? "Un compte a été provisionné, en attente de validation par le Directeur."
                    : 'Un compte de connexion est déjà lié à cette fiche.'}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-500">Aucun compte de connexion pour l'instant.</p>
                  <Button size="sm" variant="secondary" onClick={() => setProvisionOpen(true)}>
                    <KeyRound className="h-3.5 w-3.5" />
                    Provisionner un compte
                  </Button>
                </div>
              )}
            </div>

            {canManageComptes && (
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
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={toggleActifMutation.isPending}
                  onClick={() =>
                    toggleActifMutation.mutate({ id: viewingEmploye.id, actif: viewingEmploye.actif === false })
                  }
                >
                  <Power className="h-3.5 w-3.5" />
                  {viewingEmploye.actif === false ? 'Activer' : 'Désactiver'}
                </Button>
                <Button size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={isEditOpen} onClose={() => setEditOpen(false)} title="Modifier l'employé">
        {viewingEmploye && (
          <EmployeForm
            initialValues={viewingEmploye}
            isSubmitting={updateMutation.isPending}
            onCancel={() => setEditOpen(false)}
            onSubmit={(payload) => updateMutation.mutateAsync(payload)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Supprimer cette fiche employé ?"
        description="Suppression logique côté serveur, mais traite-la comme définitive."
        confirmLabel="Supprimer"
      />

      <Modal open={isProvisionOpen} onClose={() => setProvisionOpen(false)} title="Provisionner un compte">
        {viewingEmploye && (
          <ProvisionnerCompteForm
            employeType={viewingEmploye.type}
            isSubmitting={provisionMutation.isPending}
            onCancel={() => setProvisionOpen(false)}
            onSubmit={(payload) => provisionMutation.mutateAsync(payload)}
          />
        )}
      </Modal>

      <Modal
        open={isAssignMatiereOpen}
        onClose={() => setAssignMatiereOpen(false)}
        title="Ajouter une matière habilitée"
        maxWidth="max-w-sm"
      >
        {viewingEmploye && (
          <div className="space-y-4">
            <Select
              id="matiereToAssign"
              label="Matière"
              options={[
                { value: '', label: 'Choisir une matière...' },
                ...allMatieres
                  .filter(
                    (m) =>
                      !(viewingEmploye.matieres ?? []).some(
                        (item) => (item.matiereId ?? item.matiere?.id ?? item.id ?? item) === m.id,
                      ),
                  )
                  .map((m) => ({ value: m.id, label: m.intitule })),
              ]}
              value={matiereToAssign}
              onChange={(e) => setMatiereToAssign(e.target.value)}
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setAssignMatiereOpen(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                disabled={!matiereToAssign}
                isLoading={assignMatiereMutation.isPending}
                onClick={() => assignMatiereMutation.mutate(matiereToAssign)}
              >
                Ajouter
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={isContratOpen} onClose={() => setContratOpen(false)} title="Nouveau contrat" maxWidth="max-w-sm">
        {viewingEmploye && (
          <ContratForm
            employeId={viewingEmploye.id}
            isSubmitting={createContratMutation.isPending}
            onCancel={() => setContratOpen(false)}
            onSubmit={(payload) => createContratMutation.mutateAsync(payload)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(removingMatiereId)}
        onClose={() => setRemovingMatiereId(null)}
        onConfirm={() => removeMatiereMutation.mutate(removingMatiereId)}
        isLoading={removeMatiereMutation.isPending}
        title="Retirer cette habilitation ?"
        description="Cet enseignant ne pourra plus être affecté à cette matière dans une classe tant qu'elle n'est pas réajoutée."
        confirmLabel="Retirer"
      />
    </div>
  )
}
