import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ShieldCheck } from 'lucide-react'
import { createRole, listRoles } from '../../api/rbac'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { ROLE_CODE_LABELS } from '../../config/rbacLabels'
import { pick } from '../../lib/pick'
import { RoleForm } from './RoleForm'
import { RoleDetailModal } from './RoleDetailModal'

const ACTIF_FILTER_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'true', label: 'Actif' },
  { value: 'false', label: 'Inactif' },
]

/** Rôles et permissions — plateforme, pas scopé à un établissement (Admin uniquement). */
export default function RolesPage() {
  const [search, setSearch] = useState('')
  const [actifFilter, setActifFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [viewingRoleId, setViewingRoleId] = useState(null)
  const debouncedSearch = useDebouncedValue(search)
  const queryClient = useQueryClient()

  const queryKey = ['rbac', 'roles', { q: debouncedSearch, actif: actifFilter, page }]
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listRoles({ q: debouncedSearch || undefined, actif: actifFilter || undefined, page }),
    placeholderData: (previous) => previous,
  })
  const items = Array.isArray(data) ? data : (data?.items ?? [])

  const createMutation = useMutation({
    mutationFn: (payload) => createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] })
      setCreateOpen(false)
    },
  })

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Rôles et permissions</h1>
      <p className="text-sm text-ink-500 mb-6">
        Gestion des rôles de la plateforme et de leurs permissions associées.
      </p>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Créer un rôle
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
              placeholder="Rechercher un rôle..."
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
            />
          </div>
          <Select
            id="filter-actif"
            options={ACTIF_FILTER_OPTIONS}
            value={actifFilter}
            onChange={(e) => {
              setActifFilter(e.target.value)
              setPage(1)
            }}
            className="w-40"
          />
        </div>

        {isLoading && (
          <div className="p-16 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les rôles.</p>}
        {!isLoading && !isError && items.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <ShieldCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun rôle pour le moment.
          </div>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <div className="divide-y divide-ink-50">
            {items.map((r, index) => {
              const id = pick(r, ['id'], index)
              const actif = pick(r, ['actif'], true) !== false
              return (
                <div
                  key={id}
                  onClick={() => setViewingRoleId(id)}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50/60 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{pick(r, ['libelle'])}</p>
                    <p className="text-xs text-ink-400">{ROLE_CODE_LABELS[pick(r, ['code'], null)] ?? pick(r, ['code'])}</p>
                  </div>
                  <Badge variant={actif ? 'success' : 'neutral'} className="shrink-0">
                    {actif ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}

        {data && !Array.isArray(data) && (
          <div className="px-4 pb-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Créer un rôle">
        <RoleForm isSubmitting={createMutation.isPending} onCancel={() => setCreateOpen(false)} onSubmit={(payload) => createMutation.mutateAsync(payload)} />
      </Modal>

      <RoleDetailModal roleId={viewingRoleId} onClose={() => setViewingRoleId(null)} />
    </div>
  )
}
