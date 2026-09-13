import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Power, Search } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { SimpleCrudTable } from './SimpleCrudTable'
import { DynamicForm } from './DynamicForm'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-ink-50 last:border-0">
      <span className="text-sm text-ink-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-ink-900 text-right">{value ?? '—'}</span>
    </div>
  )
}

/**
 * Assemble liste + recherche/filtres + clic-sur-ligne (détail) + création +
 * modification pour une ressource académique simple. Si `updateFn` est omis,
 * la ressource est création + liste seulement (ex: types d'évaluation).
 *
 * `searchKeys` (optionnel) : champs texte de l'item où chercher (recherche
 * côté client, ces listes restent courtes — pas de pagination serveur ici).
 * `filters` (optionnel) : [{ key, label, options, getValue?(item) }] —
 * chaque filtre ajoute un <Select> ; par défaut compare `item[key]`, sinon
 * `getValue(item)` si fourni.
 */
export function SimpleResourceTab({
  queryKey,
  listFn,
  createFn,
  updateFn,
  createFields,
  editFields,
  createRules = {},
  editRules = {},
  columns,
  itemLabel,
  emptyMessage,
  emptyIcon,
  searchKeys,
  searchPlaceholder = 'Rechercher...',
  filters,
}) {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [viewingItem, setViewingItem] = useState(null)
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const debouncedSearch = useDebouncedValue(search, 250)
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({ queryKey, queryFn: listFn })
  const allItems = Array.isArray(data) ? data : (data?.items ?? [])

  const items = useMemo(() => {
    let result = allItems

    if (searchKeys && debouncedSearch.trim()) {
      const needle = debouncedSearch.trim().toLowerCase()
      result = result.filter((item) =>
        searchKeys.some((key) => String(item[key] ?? '').toLowerCase().includes(needle)),
      )
    }

    if (filters) {
      for (const filter of filters) {
        const selected = filterValues[filter.key]
        if (!selected) continue
        result = result.filter((item) => {
          const value = filter.getValue ? filter.getValue(item) : item[filter.key]
          return value === selected
        })
      }
    }

    return result
  }, [allItems, debouncedSearch, filterValues, searchKeys, filters])

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateFn(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setEditingItem(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (item) => updateFn(item.id, { actif: item.actif === false }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey })
      setViewingItem((current) =>
        current?.id === variables.id
          ? { ...current, actif: current.actif === false }
          : current,
      )
    },
  })

  function handleEdit(item) {
    setViewingItem(null)
    setEditingItem(item)
  }

  const hasToolbar = Boolean(searchKeys || filters?.length)

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {hasToolbar && (
          <div className="p-4 border-b border-ink-100 flex flex-wrap gap-3">
            {searchKeys && (
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
                />
              </div>
            )}
            {filters?.map((filter) => (
              <Select
                key={filter.key}
                id={`filter-${filter.key}`}
                options={[{ value: '', label: filter.label }, ...filter.options]}
                value={filterValues[filter.key] ?? ''}
                onChange={(e) =>
                  setFilterValues((v) => ({ ...v, [filter.key]: e.target.value }))
                }
                className="w-52"
              />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && (
          <p className="p-8 text-center text-sm text-danger-600">
            Impossible de charger la liste.
          </p>
        )}
        {!isLoading && !isError && (
          <SimpleCrudTable
            items={items}
            columns={columns}
            emptyMessage={emptyMessage}
            emptyIcon={emptyIcon}
            onRowClick={setViewingItem}
            onEdit={updateFn ? handleEdit : undefined}
            onToggleActive={updateFn ? (item) => toggleMutation.mutate(item) : undefined}
            isToggling={(item) =>
              toggleMutation.isPending && toggleMutation.variables?.id === item.id
            }
          />
        )}
      </div>

      <Modal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        title={`Ajouter ${itemLabel}`}
      >
        <DynamicForm
          fields={createFields}
          rules={createRules}
          submitLabel="Créer"
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(values) => createMutation.mutateAsync(values)}
        />
      </Modal>

      {updateFn && (
        <Modal
          open={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          title={`Modifier ${itemLabel}`}
        >
          {editingItem && (
            <DynamicForm
              fields={editFields ?? createFields}
              initialValues={editingItem}
              rules={editRules}
              submitLabel="Enregistrer"
              isSubmitting={updateMutation.isPending}
              onCancel={() => setEditingItem(null)}
              onSubmit={(values) =>
                updateMutation.mutateAsync({ id: editingItem.id, payload: values })
              }
            />
          )}
        </Modal>
      )}

      <Modal
        open={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
        title={`Détail ${itemLabel}`}
      >
        {viewingItem && (
          <>
            <div>
              {columns.map((col) => (
                <DetailRow
                  key={col.key}
                  label={col.label}
                  value={col.render ? col.render(viewingItem) : viewingItem[col.key]}
                />
              ))}
            </div>
            {updateFn && (
              <div className="flex flex-wrap justify-end gap-2 pt-5 mt-2 border-t border-ink-100">
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={
                    toggleMutation.isPending &&
                    toggleMutation.variables?.id === viewingItem.id
                  }
                  onClick={() => toggleMutation.mutate(viewingItem)}
                >
                  <Power className="h-3.5 w-3.5" />
                  {viewingItem.actif === false ? 'Activer' : 'Désactiver'}
                </Button>
                <Button size="sm" onClick={() => handleEdit(viewingItem)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
