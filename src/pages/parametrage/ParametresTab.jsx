import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Settings, Trash2 } from 'lucide-react'
import { deleteParametre, listParametres, setParametre } from '../../api/parametrage'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { CATEGORIE_PARAMETRE_LABELS, CATEGORIE_PARAMETRE_OPTIONS } from '../../config/parametrageLabels'
import { pick } from '../../lib/pick'
import { ParametreForm } from './ParametreForm'

function displayValeur(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '—'
  if (typeof valeur === 'object') return JSON.stringify(valeur)
  return String(valeur)
}

const CATEGORIE_FILTER_OPTIONS = [{ value: '', label: 'Toutes les catégories' }, ...CATEGORIE_PARAMETRE_OPTIONS]

/** Réglages clé/valeur de l'établissement, par catégorie. */
export function ParametresTab({ etablissementId }) {
  const [categorieFilter, setCategorieFilter] = useState('')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [deletingCle, setDeletingCle] = useState(null)
  const queryClient = useQueryClient()

  const queryKey = ['parametrage', 'parametres', etablissementId, categorieFilter]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listParametres(etablissementId, categorieFilter || undefined),
    enabled: Boolean(etablissementId),
  })
  const items = Array.isArray(data) ? data : (data?.items ?? [])

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['parametrage', 'parametres'] })
  }

  const setMutation = useMutation({
    mutationFn: (payload) => setParametre(etablissementId, payload),
    onSuccess: () => {
      invalidateAll()
      setCreateOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (cle) => deleteParametre(etablissementId, cle),
    onSuccess: () => {
      invalidateAll()
      setDeletingCle(null)
    },
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="max-w-xs w-full">
          <Select id="categorie-filter" label="Catégorie" options={CATEGORIE_FILTER_OPTIONS} value={categorieFilter} onChange={(e) => setCategorieFilter(e.target.value)} />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Définir un paramètre
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-16 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les paramètres." />}
        {!isLoading && !isError && items.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <Settings className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun paramètre pour l'instant.
          </div>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <div className="divide-y divide-ink-50">
            {items.map((p, index) => {
              const cle = pick(p, ['cle'], index)
              return (
                <div key={cle} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-ink-900 truncate">{cle}</p>
                      <Badge variant="neutral">{CATEGORIE_PARAMETRE_LABELS[pick(p, ['categorie'], null)] ?? pick(p, ['categorie'])}</Badge>
                    </div>
                    <p className="text-xs text-ink-500 truncate">{displayValeur(pick(p, ['valeur'], null))}</p>
                    {p.description && <p className="text-xs text-ink-400 truncate">{p.description}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeletingCle(cle)}
                    className="text-ink-400 hover:text-danger-600 transition-colors shrink-0"
                    aria-label="Supprimer ce paramètre"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Définir un paramètre">
        <ParametreForm isSubmitting={setMutation.isPending} onCancel={() => setCreateOpen(false)} onSubmit={(payload) => setMutation.mutateAsync(payload)} />
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingCle)}
        onClose={() => setDeletingCle(null)}
        onConfirm={() => deleteMutation.mutate(deletingCle)}
        isLoading={deleteMutation.isPending}
        title="Supprimer ce paramètre ?"
        description="Sa valeur sera définitivement perdue."
        confirmLabel="Supprimer"
      />
    </div>
  )
}
