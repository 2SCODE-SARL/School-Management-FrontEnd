import { useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { GraduationCap, Pencil, Search } from 'lucide-react'
import { getAccesPortailEleveStatus, searchEleves, updateEleve } from '../../api/eleves'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Pagination } from '../../components/ui/Pagination'
import { ActionsMenu } from '../../components/ui/ActionsMenu'
import { TruncatedText } from '../../components/ui/TruncatedText'
import {
  STATUT_ELEVE_LABELS,
  STATUT_ELEVE_OPTIONS,
  statutEleveBadgeVariant,
} from '../../config/eleveLabels'
import { EleveForm } from './EleveForm'
import { EleveDetailModal } from './EleveDetailModal'

const STATUT_FILTER_OPTIONS = [{ value: '', label: 'Tous les statuts' }, ...STATUT_ELEVE_OPTIONS]

export function ElevesTab({ etablissementId }) {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editingEleve, setEditingEleve] = useState(null)
  const [viewingEleveId, setViewingEleveId] = useState(null)
  const debouncedSearch = useDebouncedValue(search)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'eleves',
      'list',
      etablissementId,
      { q: debouncedSearch, statut: statutFilter, page },
    ],
    queryFn: () =>
      searchEleves(etablissementId, {
        q: debouncedSearch || undefined,
        statut: statutFilter || undefined,
        page,
      }),
    enabled: Boolean(etablissementId),
    placeholderData: (previous) => previous,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateEleve(etablissementId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eleves', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['eleves', 'detail'] })
      setEditingEleve(null)
    },
  })

  function handleEdit(eleve) {
    setViewingEleveId(null)
    setEditingEleve(eleve)
  }

  const items = data?.items ?? []

  // Comble "dossier Élève sans photo" (signalé au backend) avec celle du
  // compte portail lié quand elle existe — un appel léger par ligne
  // affichée (page paginée, pas tout l'effectif), même clé de cache que la
  // fiche détail donc pas de double appel en enchaînant liste -> détail.
  const accesQueries = useQueries({
    queries: items.map((eleve) => ({
      queryKey: ['eleves', 'acces-portail-status', etablissementId, eleve.id],
      queryFn: () => getAccesPortailEleveStatus(etablissementId, eleve.id),
      enabled: Boolean(etablissementId && eleve.id),
    })),
  })
  const photoByEleveId = Object.fromEntries(
    items.map((eleve, i) => [eleve.id, accesQueries[i]?.data?.utilisateur?.photoUrl]),
  )

  return (
    <div>
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
              placeholder="Rechercher par nom ou matricule..."
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
            />
          </div>
          <Select
            id="filter-statut"
            options={STATUT_FILTER_OPTIONS}
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
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les élèves." />}
        {!isLoading && !isError && items.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <GraduationCap className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun élève pour le moment.
          </div>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Élève</th>
                  <th className="px-4 py-3 font-medium">Matricule</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((eleve) => (
                  <tr
                    key={eleve.id}
                    onClick={() => setViewingEleveId(eleve.id)}
                    className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={`${eleve.prenom ?? ''} ${eleve.nom ?? ''}`.trim()}
                          src={eleve.photoUrl || photoByEleveId[eleve.id]}
                          size={32}
                        />
                        <TruncatedText
                          text={`${eleve.prenom ?? ''} ${eleve.nom ?? ''}`.trim()}
                          maxWidth={180}
                          className="font-medium text-ink-900"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{eleve.matricule ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-600">
                      <TruncatedText text={eleve.telephone} maxWidth={160} />
                    </td>
                    <td className="px-4 py-3">
                      {eleve.statut ? (
                        <Badge variant={statutEleveBadgeVariant(eleve.statut)}>
                          {STATUT_ELEVE_LABELS[eleve.statut] ?? eleve.statut}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">—</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionsMenu
                        actions={[
                          {
                            label: 'Voir la fiche',
                            icon: GraduationCap,
                            onClick: () => setViewingEleveId(eleve.id),
                          },
                          {
                            label: 'Modifier',
                            icon: Pencil,
                            onClick: () => setEditingEleve(eleve),
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
        open={Boolean(editingEleve)}
        onClose={() => setEditingEleve(null)}
        title="Modifier l'élève"
      >
        {editingEleve && (
          <EleveForm
            initialValues={editingEleve}
            isSubmitting={updateMutation.isPending}
            onCancel={() => setEditingEleve(null)}
            onSubmit={(payload) =>
              updateMutation.mutateAsync({ id: editingEleve.id, payload })
            }
          />
        )}
      </Modal>

      <EleveDetailModal
        eleveId={viewingEleveId}
        etablissementId={etablissementId}
        onClose={() => setViewingEleveId(null)}
        onEdit={handleEdit}
      />
    </div>
  )
}
