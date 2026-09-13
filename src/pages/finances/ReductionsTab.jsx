import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BadgePercent, Plus } from 'lucide-react'
import { createReduction } from '../../api/finances'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { REDUCTION_TYPE_OPTIONS } from '../../config/financesLabels'
import { reductionsSessionKey } from '../../lib/reductionsSessionCache'

const EMPTY_FORM = { type: REDUCTION_TYPE_OPTIONS[0].value, libelle: '', pourcentage: '', montant: '' }

function ReductionForm({ onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  // L'API exige EXACTEMENT un des deux (pas "au moins un") — un 400
  // "doit utiliser exactement un mode" en a fait la preuve en live quand
  // les deux champs étaient remplis. On les rend mutuellement exclusifs :
  // remplir l'un vide l'autre, et on désactive celui qui n'est pas actif.
  function updatePourcentage(e) {
    const value = e.target.value
    setForm((f) => ({ ...f, pourcentage: value, montant: value ? '' : f.montant }))
    setFormError('')
  }
  function updateMontant(e) {
    const value = e.target.value
    setForm((f) => ({ ...f, montant: value, pourcentage: value ? '' : f.pourcentage }))
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate(form, { libelle: [rules.required('Le libellé est requis.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    if (!form.pourcentage && !form.montant) {
      setFormError('Indique un pourcentage OU un montant fixe.')
      return
    }

    try {
      const payload = { type: form.type, libelle: form.libelle }
      if (form.pourcentage) payload.pourcentage = Number(form.pourcentage)
      if (form.montant) payload.montant = Number(form.montant)
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Select id="type" label="Type" options={REDUCTION_TYPE_OPTIONS} value={form.type} onChange={update('type')} required />
      <TextField id="libelle" label="Libellé" required value={form.libelle} onChange={update('libelle')} error={fieldErrors.libelle} placeholder="Bourse mérite 50%" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="pourcentage"
          label="Pourcentage (optionnel)"
          type="number"
          value={form.pourcentage}
          onChange={updatePourcentage}
          disabled={Boolean(form.montant)}
          placeholder="50"
        />
        <TextField
          id="montant"
          label="Montant fixe (optionnel)"
          type="number"
          value={form.montant}
          onChange={updateMontant}
          disabled={Boolean(form.pourcentage)}
          placeholder="100000"
        />
      </div>
      <p className="text-xs text-ink-400">
        Indique exactement l'un des deux — pourcentage OU montant fixe, pas les deux (remplir l'un vide l'autre).
      </p>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Créer
        </Button>
      </div>
    </form>
  )
}

/**
 * Réductions/bourses — AUCUN `GET` de liste n'existe côté backend
 * (seulement créer/modifier), signalé. On n'affiche donc que celles créées
 * pendant cette session (perdu au rechargement), accumulées dans le cache
 * React Query (voir `reductionsSessionCache.js`) pour que l'onglet
 * Échéances puisse les proposer sans redemander leur id.
 */
export function ReductionsTab({ etablissementId }) {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()
  const cacheKey = reductionsSessionKey(etablissementId)
  const reductions = queryClient.getQueryData(cacheKey) ?? []

  const createMutation = useMutation({
    mutationFn: (payload) => createReduction(etablissementId, payload),
    onSuccess: (result) => {
      queryClient.setQueryData(cacheKey, (old = []) => [...old, result ?? {}])
      setCreateOpen(false)
    },
  })

  return (
    <div>
      <Alert variant="warning" className="mb-4">
        Le backend ne fournit pas encore de liste des réductions/bourses déjà créées (endpoint signalé) — seules
        celles créées pendant cette session apparaissent ci-dessous, pour pouvoir les appliquer à une échéance.
      </Alert>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Créer une réduction / bourse
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {reductions.length === 0 ? (
          <div className="p-16 text-center text-ink-400">
            <BadgePercent className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucune réduction créée pendant cette session pour l'instant.
          </div>
        ) : (
          <div className="divide-y divide-ink-50">
            {reductions.map((r, index) => (
              <div key={r.id ?? index} className="px-4 py-3">
                <p className="text-sm font-medium text-ink-900">{r.libelle}</p>
                <p className="text-xs text-ink-400">
                  {r.type} {r.pourcentage ? `· ${r.pourcentage}%` : ''} {r.montant ? `· ${r.montant} GNF` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Créer une réduction / bourse">
        <ReductionForm
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>
    </div>
  )
}
