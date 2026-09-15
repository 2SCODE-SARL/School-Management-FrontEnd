import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Receipt } from 'lucide-react'
import { createDepense, listDepenses, validerDepense } from '../../api/finances'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Pagination } from '../../components/ui/Pagination'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { MODE_PAIEMENT_OPTIONS } from '../../config/financesLabels'
import { pick } from '../../lib/pick'
import { formatDate } from '../../lib/formatDate'

const EMPTY_FORM = {
  categorieId: '',
  tresorerieId: '',
  sousCategorie: '',
  montant: '',
  date: new Date().toISOString().slice(0, 10),
  mode: MODE_PAIEMENT_OPTIONS[0].value,
  budgetId: '',
  justificatifUrl: '',
}

/** `CreateDepenseDto` : categorieId/tresorerieId/montant/date/mode requis. Ni catégorie ni trésorerie n'ont d'endpoint de liste — champs texte libre, signalé au backend. */
function DepenseForm({ onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate(form, {
      categorieId: [rules.required('La catégorie est requise.')],
      tresorerieId: [rules.required('La trésorerie est requise.')],
      montant: [rules.required('Le montant est requis.')],
      date: [rules.required('La date est requise.')],
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
      payload.montant = Number(payload.montant)
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Alert variant="warning">
        Aucun endpoint ne liste/crée les catégories de dépense ni les trésoreries — champs texte libre en attendant
        une clarification du backend (signalé).
      </Alert>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField id="categorieId" label="Id de la catégorie" required value={form.categorieId} onChange={update('categorieId')} error={fieldErrors.categorieId} />
        <TextField id="tresorerieId" label="Id de la trésorerie" required value={form.tresorerieId} onChange={update('tresorerieId')} error={fieldErrors.tresorerieId} />
      </div>
      <TextField id="sousCategorie" label="Sous-catégorie (optionnel)" value={form.sousCategorie} onChange={update('sousCategorie')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField id="montant" label="Montant (GNF)" type="number" required value={form.montant} onChange={update('montant')} error={fieldErrors.montant} />
        <TextField id="date" label="Date" type="date" required value={form.date} onChange={update('date')} error={fieldErrors.date} />
      </div>
      <Select id="mode" label="Mode de paiement" options={MODE_PAIEMENT_OPTIONS} value={form.mode} onChange={update('mode')} required />
      <TextField id="budgetId" label="Id du budget associé (optionnel)" value={form.budgetId} onChange={update('budgetId')} />
      <TextField id="justificatifUrl" label="URL du justificatif (optionnel)" value={form.justificatifUrl} onChange={update('justificatifUrl')} />

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

export function DepensesTab({ etablissementId, canValider }) {
  const [page, setPage] = useState(1)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const queryKey = ['finances', 'depenses', etablissementId, page]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listDepenses(etablissementId, { page }),
    enabled: Boolean(etablissementId),
    placeholderData: (previous) => previous,
  })
  const items = Array.isArray(data) ? data : (data?.items ?? [])

  const createMutation = useMutation({
    mutationFn: (payload) => createDepense(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances', 'depenses'] })
      setCreateOpen(false)
    },
  })
  const validerMutation = useMutation({
    mutationFn: (depenseId) => validerDepense(etablissementId, depenseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finances', 'depenses'] }),
  })

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Enregistrer une dépense
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les dépenses." />}
        {!isLoading && !isError && items.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <Receipt className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucune dépense pour l'instant.
          </div>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <div className="divide-y divide-ink-50">
            {items.map((d, index) => {
              const statut = pick(d, ['statut'], null)
              const enAttente = statut === 'EN_ATTENTE'
              return (
                <div key={pick(d, ['id'], index)} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{pick(d, ['sousCategorie', 'categorieId'], 'Dépense')}</p>
                    <p className="text-xs text-ink-400">{formatDate(pick(d, ['date'], null)) ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-semibold text-ink-900">{pick(d, ['montant'])} GNF</p>
                    {statut && <Badge variant={enAttente ? 'warning' : 'success'}>{statut}</Badge>}
                    {canValider && enAttente && (
                      <Button size="sm" variant="secondary" isLoading={validerMutation.isPending && validerMutation.variables === pick(d, ['id'])} onClick={() => validerMutation.mutate(pick(d, ['id']))}>
                        Valider
                      </Button>
                    )}
                  </div>
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

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Enregistrer une dépense">
        <DepenseForm isSubmitting={createMutation.isPending} onCancel={() => setCreateOpen(false)} onSubmit={(payload) => createMutation.mutateAsync(payload)} />
      </Modal>
    </div>
  )
}
