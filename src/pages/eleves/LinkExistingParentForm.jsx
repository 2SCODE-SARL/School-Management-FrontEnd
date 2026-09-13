import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { getEleve, searchEleves } from '../../api/eleves'
import { Button } from '../../components/ui/Button'
import { Combobox } from '../../components/ui/Combobox'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { PARENT_TYPE_LABELS } from '../../config/eleveLabels'

/**
 * Rattache à l'élève courant un parent déjà présent dans le système, via un
 * frère/sœur déjà inscrit — aucun endpoint ne permet de chercher un parent
 * directement (ni liste, ni recherche par nom/téléphone), c'est la seule
 * voie possible pour éviter de ressaisir ses infos.
 */
export function LinkExistingParentForm({ etablissementId, currentEleveId, onCancel, onSubmit, isSubmitting }) {
  const [siblingId, setSiblingId] = useState('')
  const [selectedParentId, setSelectedParentId] = useState('')
  const [formError, setFormError] = useState('')

  const { data: elevesData } = useQuery({
    queryKey: ['eleves', 'options', etablissementId],
    queryFn: () => searchEleves(etablissementId, { limit: 100 }),
    enabled: Boolean(etablissementId),
  })
  const eleveOptions = (elevesData?.items ?? [])
    .filter((e) => e.id !== currentEleveId)
    .map((e) => ({
      value: e.id,
      label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() + (e.matricule ? ` (${e.matricule})` : ''),
    }))

  const { data: sibling, isLoading: isLoadingSibling } = useQuery({
    queryKey: ['eleves', 'detail', etablissementId, siblingId],
    queryFn: () => getEleve(etablissementId, siblingId),
    enabled: Boolean(etablissementId && siblingId),
  })
  const siblingParents = sibling?.parents ?? []

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!selectedParentId) {
      setFormError('Choisis un parent à rattacher.')
      return
    }
    try {
      await onSubmit(selectedParentId)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Combobox
        id="siblingId"
        label="Frère ou sœur déjà inscrit(e)"
        options={eleveOptions}
        value={siblingId}
        onChange={(v) => {
          setSiblingId(v)
          setSelectedParentId('')
        }}
        placeholder="Rechercher un élève..."
        searchPlaceholder="Rechercher par nom..."
      />

      {siblingId && (
        <div>
          <p className="text-sm font-medium text-ink-700 mb-2">Ses parents / tuteurs</p>
          {isLoadingSibling ? (
            <div className="p-4 flex justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
            </div>
          ) : siblingParents.length === 0 ? (
            <p className="text-sm text-ink-400">Aucun parent rattaché à cet élève.</p>
          ) : (
            <div className="space-y-2">
              {siblingParents.map((item) => {
                const parent = item.parent ?? item
                const parentId = item.parent?.id ?? item.parentId ?? item.id
                return (
                  <button
                    key={parentId}
                    type="button"
                    onClick={() => setSelectedParentId(parentId)}
                    className={[
                      'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                      selectedParentId === parentId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-ink-100 hover:border-ink-200',
                    ].join(' ')}
                  >
                    <Users className="h-4 w-4 text-ink-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{parent.nomPrenom ?? 'Parent'}</p>
                      <p className="text-xs text-ink-400">{PARENT_TYPE_LABELS[parent.type] ?? parent.type}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={!selectedParentId} isLoading={isSubmitting}>
          Rattacher ce parent
        </Button>
      </div>
    </form>
  )
}
