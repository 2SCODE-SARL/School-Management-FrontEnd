import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, KeyRound, Pencil, Plus, Power, Search, Trash2, Users as UsersIcon } from 'lucide-react'
import {
  activateUser,
  createUser,
  deactivateUser,
  deleteUser,
  resetUserPassword,
  searchUsers,
  updateUser,
} from '../../../api/users'
import { searchEtablissements } from '../../../api/etablissements'
import { createEmployeFromUser } from '../../../api/rh'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useAuth } from '../../../auth/AuthContext'
import { getPrimaryRole } from '../../../auth/roleHome'
import { generatePassword } from '../../../lib/generatePassword'
import { ApiErrorMessage } from '../../../components/ui/ApiErrorMessage'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Pagination } from '../../../components/ui/Pagination'
import { Select } from '../../../components/ui/Select'
import { Combobox } from '../../../components/ui/Combobox'
import { Avatar } from '../../../components/ui/Avatar'
import { ActionsMenu } from '../../../components/ui/ActionsMenu'
import { TruncatedText } from '../../../components/ui/TruncatedText'
import { ROLE_LABELS } from '../../../config/roles'
import { UserForm } from './UserForm'
import { UserEditForm } from './UserEditForm'
import { UserDetailModal } from './UserDetailModal'
import { PasswordRevealModal } from './PasswordRevealModal'
import { RattacherEmployeForm } from './RattacherEmployeForm'

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'true', label: 'Actif' },
  { value: 'false', label: 'Inactif' },
]

export default function UtilisateursPage() {
  const { user: currentUser } = useAuth()
  // Directeur et Admin ont la parité complète sur ce module (12/12
  // endpoints confirmés côté backend) : pas de distinction créer/modifier/
  // supprimer à faire ici. Seule la vue "toutes les écoles" reste
  // exclusive à l'Admin (le Directeur n'a pas accès à /api/etablissements,
  // vérifié : 403 "Rôle requis: ADMINISTRATEUR").
  const canViewAllEtablissements = getPrimaryRole(currentUser) === 'ADMINISTRATEUR'

  const [search, setSearch] = useState('')
  const [etablissementFilter, setEtablissementFilter] = useState(
    canViewAllEtablissements ? '' : (currentUser?.etablissementId ?? ''),
  )
  const [statutFilter, setStatutFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)
  const [credentials, setCredentials] = useState(null) // { email, password }
  const [rattachingUser, setRattachingUser] = useState(null)
  const debouncedSearch = useDebouncedValue(search)

  const queryClient = useQueryClient()

  const { data: etablissementsData } = useQuery({
    queryKey: ['etablissements', 'options'],
    queryFn: () => searchEtablissements({ limit: 100 }),
    enabled: canViewAllEtablissements,
  })
  const etablissementOptions = [
    { value: '', label: 'Tous les établissements' },
    ...(etablissementsData?.items ?? []).map((e) => ({ value: e.id, label: e.nom })),
  ]

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'users',
      {
        email: debouncedSearch,
        etablissementId: etablissementFilter,
        actif: statutFilter,
        page,
      },
    ],
    queryFn: () =>
      searchUsers({
        email: debouncedSearch || undefined,
        etablissementId: etablissementFilter || undefined,
        actif: statutFilter === '' ? undefined : statutFilter === 'true',
        page,
      }),
    placeholderData: (previous) => previous,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setCreateOpen(false)
      setCredentials({ email: variables.email, password: variables.password })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeletingUser(null)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, actif }) => (actif ? deactivateUser(id) : activateUser(id)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setViewingUser((current) =>
        current?.id === variables.id ? { ...current, actif: !current.actif } : current,
      )
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }) => resetUserPassword(id, password),
    onSuccess: (_data, variables) =>
      setCredentials({ email: variables.email, password: variables.password }),
  })

  function handleResetPassword(user) {
    resetPasswordMutation.mutate({
      id: user.id,
      email: user.email,
      password: generatePassword(),
    })
  }

  function handleEdit(user) {
    setViewingUser(null)
    setEditingUser(user)
  }

  function handleDelete(user) {
    setViewingUser(null)
    setDeletingUser(user)
  }

  function handleToggleActive(user) {
    toggleActiveMutation.mutate({ id: user.id, actif: user.actif })
  }

  const rattacherEmployeMutation = useMutation({
    mutationFn: (payload) =>
      createEmployeFromUser(
        rattachingUser.etablissementId ?? rattachingUser.etablissement?.id,
        rattachingUser.id,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rh', 'employes'] })
      setRattachingUser(null)
    },
  })

  function handleRattacherEmploye(user) {
    setViewingUser(null)
    setRattachingUser(user)
  }

  const items = data?.items ?? []

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">
            Utilisateurs
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Créez les comptes (directeurs, comptables, enseignants...)
            rattachés à un établissement.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        <div className="p-4 border-b border-ink-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Rechercher par email..."
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
            />
          </div>
          {canViewAllEtablissements && (
            <Combobox
              id="filter-etablissement"
              options={etablissementOptions}
              value={etablissementFilter}
              onChange={(value) => {
                setEtablissementFilter(value)
                setPage(1)
              }}
              searchPlaceholder="Rechercher une école..."
              className="w-56"
            />
          )}
          <Select
            id="filter-statut"
            options={STATUT_OPTIONS}
            value={statutFilter}
            onChange={(e) => {
              setStatutFilter(e.target.value)
              setPage(1)
            }}
            className="w-44"
          />
        </div>

        {isLoading && (
          <div className="p-16 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}

        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les utilisateurs." />}

        {!isLoading && !isError && items.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <UsersIcon className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun utilisateur pour le moment.
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Utilisateur</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  {canViewAllEtablissements && (
                    <th className="px-4 py-3 font-medium">École</th>
                  )}
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setViewingUser(user)}
                    className={[
                      'border-b border-ink-50 last:border-0 transition-colors cursor-pointer',
                      user.actif
                        ? 'hover:bg-ink-50/60'
                        : 'bg-danger-50/50 hover:bg-danger-50/70',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={`${user.prenom ?? ''} ${user.nom ?? ''}`}
                          src={user.photoUrl}
                          size={32}
                        />
                        <TruncatedText
                          text={`${user.prenom ?? ''} ${user.nom ?? ''}`.trim()}
                          maxWidth={160}
                          className="font-medium text-ink-900"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="primary">
                        {ROLE_LABELS[user.roles?.[0]?.role?.code] ??
                          user.roles?.[0]?.role?.libelle ??
                          '—'}
                      </Badge>
                    </td>
                    {canViewAllEtablissements && (
                      <td className="px-4 py-3 text-ink-600">
                        <TruncatedText text={user.etablissement?.nom} maxWidth={160} />
                      </td>
                    )}
                    <td className="px-4 py-3 text-ink-600">
                      <TruncatedText text={user.email} maxWidth={200} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.actif ? 'success' : 'danger'}>
                        {user.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionsMenu
                        actions={[
                          {
                            label: 'Voir les détails',
                            icon: Eye,
                            onClick: () => setViewingUser(user),
                          },
                          {
                            label: 'Modifier',
                            icon: Pencil,
                            onClick: () => handleEdit(user),
                          },
                          {
                            label: 'Réinitialiser le mot de passe',
                            icon: KeyRound,
                            onClick: () => handleResetPassword(user),
                            isLoading:
                              resetPasswordMutation.isPending &&
                              resetPasswordMutation.variables?.id === user.id,
                          },
                          {
                            label: user.actif ? 'Désactiver' : 'Activer',
                            icon: Power,
                            onClick: () => handleToggleActive(user),
                            isLoading:
                              toggleActiveMutation.isPending &&
                              toggleActiveMutation.variables?.id === user.id,
                          },
                          {
                            label: 'Supprimer',
                            icon: Trash2,
                            variant: 'danger',
                            onClick: () => handleDelete(user),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && (
          <div className="px-4 pb-4">
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <Modal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouvel utilisateur"
      >
        <UserForm
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>

      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="Modifier l'utilisateur"
      >
        {editingUser && (
          <UserEditForm
            user={editingUser}
            isSubmitting={updateMutation.isPending}
            onCancel={() => setEditingUser(null)}
            onSubmit={(payload) =>
              updateMutation.mutateAsync({ id: editingUser.id, payload })
            }
          />
        )}
      </Modal>

      <UserDetailModal
        user={viewingUser}
        onClose={() => setViewingUser(null)}
        onEdit={handleEdit}
        onResetPassword={handleResetPassword}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onRattacherEmploye={handleRattacherEmploye}
        isTogglingActive={toggleActiveMutation.isPending}
        isResettingPassword={resetPasswordMutation.isPending}
      />

      <Modal
        open={Boolean(rattachingUser)}
        onClose={() => setRattachingUser(null)}
        title="Créer le dossier employé"
        maxWidth="max-w-sm"
      >
        {rattachingUser && (
          <RattacherEmployeForm
            isSubmitting={rattacherEmployeMutation.isPending}
            onCancel={() => setRattachingUser(null)}
            onSubmit={(payload) => rattacherEmployeMutation.mutateAsync(payload)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deleteMutation.mutate(deletingUser.id)}
        isLoading={deleteMutation.isPending}
        title="Supprimer cet utilisateur ?"
        description={`Le compte de ${deletingUser?.prenom ?? ''} ${deletingUser?.nom ?? ''} sera supprimé (suppression réversible côté backend, mais son accès sera immédiatement coupé).`}
        confirmLabel="Supprimer"
      />

      <PasswordRevealModal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        email={credentials?.email}
        password={credentials?.password}
      />
    </div>
  )
}
