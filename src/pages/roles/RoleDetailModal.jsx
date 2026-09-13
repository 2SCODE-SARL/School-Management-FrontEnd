import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { assignPermissions, getRole, getRolePermissions, removeAllPermissions, updateRole } from '../../api/rbac'
import { Modal } from '../../components/ui/Modal'
import { InfoRow } from '../../components/ui/InfoRow'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ApiError } from '../../api/client'
import { ROLE_CODE_LABELS } from '../../config/rbacLabels'
import { pick, pickArray } from '../../lib/pick'

/**
 * Détail d'un rôle : ses permissions, association/retrait,
 * activer/désactiver. Aucun endpoint ne liste l'univers des permissions
 * disponibles (signalé au backend) — on ne peut donc qu'associer des ids
 * déjà connus (texte libre), pas les choisir dans une liste.
 */
export function RoleDetailModal({ roleId, onClose }) {
  const [permissionIdsInput, setPermissionIdsInput] = useState('')
  const [assignError, setAssignError] = useState('')
  const [confirmRemoveAll, setConfirmRemoveAll] = useState(false)
  const queryClient = useQueryClient()

  const roleQueryKey = ['rbac', 'role', roleId]
  const { data: role, isLoading, isError } = useQuery({
    queryKey: roleQueryKey,
    queryFn: () => getRole(roleId),
    enabled: Boolean(roleId),
  })

  const permsQueryKey = ['rbac', 'role-permissions', roleId]
  const { data: permsData, isLoading: isLoadingPerms } = useQuery({
    queryKey: permsQueryKey,
    queryFn: () => getRolePermissions(roleId),
    enabled: Boolean(roleId),
  })
  const permissions = pickArray(permsData, ['items', 'permissions']).length
    ? pickArray(permsData, ['items', 'permissions'])
    : Array.isArray(permsData)
      ? permsData
      : (role?.permissions ?? [])

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: roleQueryKey })
    queryClient.invalidateQueries({ queryKey: permsQueryKey })
    queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] })
  }

  const actifMutation = useMutation({
    mutationFn: (actif) => updateRole(roleId, { actif }),
    onSuccess: invalidateAll,
  })

  const assignMutation = useMutation({
    mutationFn: (permissionIds) => assignPermissions(roleId, permissionIds),
    onSuccess: () => {
      invalidateAll()
      setPermissionIdsInput('')
      setAssignError('')
    },
    onError: (err) => setAssignError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  const removeAllMutation = useMutation({
    mutationFn: () => removeAllPermissions(roleId),
    onSuccess: () => {
      invalidateAll()
      setConfirmRemoveAll(false)
    },
  })

  function handleAssign() {
    setAssignError('')
    const ids = permissionIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (ids.length === 0) {
      setAssignError('Indique au moins un id de permission.')
      return
    }
    assignMutation.mutate(ids)
  }

  if (!role) {
    return (
      <Modal open={Boolean(roleId)} onClose={onClose} title="Détail du rôle">
        {isLoading && (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <p className="text-sm text-danger-600 text-center py-8">Impossible de charger ce rôle.</p>}
      </Modal>
    )
  }

  const actif = pick(role, ['actif'], true) !== false

  return (
    <>
      <Modal open={Boolean(roleId)} onClose={onClose} title="Détail du rôle">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold text-ink-900 truncate">{role.libelle}</p>
            <p className="text-xs text-ink-400">{ROLE_CODE_LABELS[role.code] ?? role.code}</p>
          </div>
          <Badge variant={actif ? 'success' : 'neutral'} className="shrink-0">
            {actif ? 'Actif' : 'Inactif'}
          </Badge>
        </div>

        <div className="flex justify-end mb-4">
          <Button size="sm" variant="secondary" isLoading={actifMutation.isPending} onClick={() => actifMutation.mutate(!actif)}>
            {actif ? 'Désactiver' : 'Activer'}
          </Button>
        </div>

        <div className="pt-4 border-t border-ink-100">
          <p className="text-sm font-medium text-ink-900 mb-3">Permissions associées</p>
          {isLoadingPerms ? (
            <div className="p-4 flex justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
            </div>
          ) : permissions.length === 0 ? (
            <p className="text-sm text-ink-400">Aucune permission associée.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {permissions.map((p, i) => (
                <Badge key={pick(p, ['id'], i)} variant="neutral">
                  <KeyRound className="h-3 w-3 mr-1 inline" />
                  {pick(p, ['code', 'libelle', 'nom'], pick(p, ['id'], `#${i}`))}
                </Badge>
              ))}
            </div>
          )}

          <Alert variant="warning" className="mb-3">
            Aucun endpoint ne liste l'univers des permissions disponibles — seuls des ids déjà connus peuvent être
            associés ici (texte libre, séparés par des virgules).
          </Alert>

          <div className="flex items-end gap-2">
            <TextField
              id="permissionIds"
              label="Id(s) de permission à associer"
              value={permissionIdsInput}
              onChange={(e) => setPermissionIdsInput(e.target.value)}
              placeholder="id1, id2..."
              className="flex-1"
            />
            <Button size="sm" isLoading={assignMutation.isPending} onClick={handleAssign}>
              <Plus className="h-3.5 w-3.5" />
              Associer
            </Button>
          </div>
          {assignError && <Alert variant="danger" className="mt-2">{assignError}</Alert>}

          {permissions.length > 0 && (
            <div className="flex justify-end mt-3">
              <Button size="sm" variant="secondary" className="!text-danger-600" onClick={() => setConfirmRemoveAll(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Retirer toutes les permissions
              </Button>
            </div>
          )}
        </div>

        <InfoRow icon={ShieldCheck} label="Id du rôle" value={role.id} />
      </Modal>

      <ConfirmDialog
        open={confirmRemoveAll}
        onClose={() => setConfirmRemoveAll(false)}
        onConfirm={() => removeAllMutation.mutate()}
        isLoading={removeAllMutation.isPending}
        title="Retirer toutes les permissions de ce rôle ?"
        description="Tous les utilisateurs ayant ce rôle perdront ces permissions immédiatement."
        confirmLabel="Retirer tout"
      />
    </>
  )
}
