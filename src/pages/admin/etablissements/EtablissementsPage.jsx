import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Eye, Pencil, Plus, Power, Search } from 'lucide-react'
import {
  activateEtablissement,
  createEtablissement,
  deactivateEtablissement,
  searchEtablissements,
  updateEtablissement,
} from '../../../api/etablissements'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { ApiErrorMessage } from '../../../components/ui/ApiErrorMessage'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Pagination } from '../../../components/ui/Pagination'
import { Select } from '../../../components/ui/Select'
import { ActionsMenu } from '../../../components/ui/ActionsMenu'
import { TruncatedText } from '../../../components/ui/TruncatedText'
import { EtablissementForm } from './EtablissementForm'
import { EtablissementDetailModal } from './EtablissementDetailModal'

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'true', label: 'Actif' },
  { value: 'false', label: 'Inactif' },
]

// Cette page n'est de toute façon accessible qu'au rôle ADMINISTRATEUR
// (route protégée par RequireRole) — pas besoin de vérifier une permission
// supplémentaire ici, le backend n'en distingue pas à ce niveau.
export default function EtablissementsPage() {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editingEtab, setEditingEtab] = useState(null)
  const [viewingEtab, setViewingEtab] = useState(null)
  const debouncedSearch = useDebouncedValue(search)

  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'etablissements',
      { q: debouncedSearch, actif: statutFilter, page },
    ],
    queryFn: () =>
      searchEtablissements({
        q: debouncedSearch || undefined,
        actif: statutFilter === '' ? undefined : statutFilter === 'true',
        page,
      }),
    placeholderData: (previous) => previous,
  })

  const createMutation = useMutation({
    mutationFn: createEtablissement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etablissements'] })
      setCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateEtablissement(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etablissements'] })
      setEditingEtab(null)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, actif }) =>
      actif ? deactivateEtablissement(id) : activateEtablissement(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['etablissements'] })
      // Garde la modale de détail à jour si elle est ouverte sur cette ligne.
      setViewingEtab((current) =>
        current?.id === variables.id ? { ...current, actif: !current.actif } : current,
      )
    },
  })

  function handleEdit(etab) {
    setViewingEtab(null)
    setEditingEtab(etab)
  }

  function handleToggleActive(etab) {
    toggleActiveMutation.mutate({ id: etab.id, actif: etab.actif })
  }

  const items = data?.items ?? []

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">
            Établissements
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Gérez les écoles rattachées à la plateforme.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvel établissement
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
              placeholder="Rechercher par nom ou code..."
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
            />
          </div>
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

        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les établissements." />}

        {!isLoading && !isError && items.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <Building2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun établissement pour le moment.
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Établissement</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Région</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((etab) => (
                  <tr
                    key={etab.id}
                    onClick={() => setViewingEtab(etab)}
                    className={[
                      'border-b border-ink-50 last:border-0 transition-colors cursor-pointer',
                      etab.actif ? 'hover:bg-ink-50/60' : 'bg-danger-50/50 hover:bg-danger-50/70',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3">
                      <TruncatedText
                        text={etab.nom}
                        maxWidth={220}
                        className="font-medium text-ink-900"
                      />
                      {etab.slogan && (
                        <TruncatedText
                          text={etab.slogan}
                          maxWidth={220}
                          className="text-xs text-ink-400"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{etab.code}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {etab.region ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      <TruncatedText
                        text={etab.telephone ?? etab.email}
                        maxWidth={160}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={etab.actif ? 'success' : 'danger'}>
                        {etab.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionsMenu
                        actions={[
                          {
                            label: 'Voir les détails',
                            icon: Eye,
                            onClick: () => setViewingEtab(etab),
                          },
                          {
                            label: 'Modifier',
                            icon: Pencil,
                            onClick: () => handleEdit(etab),
                          },
                          {
                            label: etab.actif ? 'Désactiver' : 'Activer',
                            icon: Power,
                            onClick: () => handleToggleActive(etab),
                            isLoading:
                              toggleActiveMutation.isPending &&
                              toggleActiveMutation.variables?.id === etab.id,
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
        title="Nouvel établissement"
      >
        <EtablissementForm
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>

      <Modal
        open={Boolean(editingEtab)}
        onClose={() => setEditingEtab(null)}
        title="Modifier l'établissement"
      >
        {editingEtab && (
          <EtablissementForm
            initialValues={editingEtab}
            isSubmitting={updateMutation.isPending}
            onCancel={() => setEditingEtab(null)}
            onSubmit={(payload) =>
              updateMutation.mutateAsync({ id: editingEtab.id, payload })
            }
          />
        )}
      </Modal>

      <EtablissementDetailModal
        etablissement={viewingEtab}
        onClose={() => setViewingEtab(null)}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        isToggling={toggleActiveMutation.isPending}
      />
    </div>
  )
}
