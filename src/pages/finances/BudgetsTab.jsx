import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, PiggyBank, Plus } from 'lucide-react'
import { createBudget, listBudgets, listBudgetsAlertes } from '../../api/finances'
import { listAnneesScolaires } from '../../api/etablissements'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { Pagination } from '../../components/ui/Pagination'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { pick } from '../../lib/pick'

const EMPTY_FORM = { service: '', departement: '', montantPrevu: '', seuilAlerte: '' }

function BudgetForm({ onSubmit, onCancel, isSubmitting }) {
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
    const errors = validate(form, { montantPrevu: [rules.required('Le montant prévu est requis.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
      payload.montantPrevu = Number(payload.montantPrevu)
      if (payload.seuilAlerte) payload.seuilAlerte = Number(payload.seuilAlerte)
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField id="service" label="Service (optionnel)" value={form.service} onChange={update('service')} placeholder="Direction" />
        <TextField id="departement" label="Département (optionnel)" value={form.departement} onChange={update('departement')} placeholder="Pédagogie" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField id="montantPrevu" label="Montant prévu (GNF)" type="number" required value={form.montantPrevu} onChange={update('montantPrevu')} error={fieldErrors.montantPrevu} />
        <TextField id="seuilAlerte" label="Seuil d'alerte % (optionnel)" type="number" value={form.seuilAlerte} onChange={update('seuilAlerte')} placeholder="90" />
      </div>
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

export function BudgetsTab({ etablissementId }) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: anneesData } = useQuery({
    queryKey: ['academique', 'annees', etablissementId],
    queryFn: () => listAnneesScolaires(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const annees = Array.isArray(anneesData) ? anneesData : (anneesData?.items ?? [])
  const anneeOptions = annees.map((a) => ({ value: a.id, label: a.libelle }))

  useEffect(() => {
    setAnneeScolaireId('')
  }, [etablissementId])

  useEffect(() => {
    if (anneeScolaireId || annees.length === 0) return
    const enCours = annees.find((a) => a.statut === 'EN_COURS')
    const fallback = annees.slice().sort((a, b) => (b.dateDebut ?? '').localeCompare(a.dateDebut ?? ''))[0]
    setAnneeScolaireId((enCours ?? fallback)?.id ?? '')
  }, [annees, anneeScolaireId])

  const queryKey = ['finances', 'budgets', etablissementId, anneeScolaireId, page]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listBudgets(etablissementId, { anneeScolaireId, page }),
    enabled: Boolean(etablissementId && anneeScolaireId),
    placeholderData: (previous) => previous,
  })
  const items = Array.isArray(data) ? data : (data?.items ?? [])

  const { data: alertesData } = useQuery({
    queryKey: ['finances', 'budgets', 'alertes', etablissementId],
    queryFn: () => listBudgetsAlertes(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const alertes = Array.isArray(alertesData) ? alertesData : (alertesData?.items ?? [])

  const createMutation = useMutation({
    mutationFn: (payload) => createBudget(etablissementId, { ...payload, anneeScolaireId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances', 'budgets'] })
      setCreateOpen(false)
    },
  })

  return (
    <div className="space-y-4">
      {alertes.length > 0 && (
        <Alert variant="warning">
          <div className="flex items-center gap-2 mb-1 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {alertes.length} budget{alertes.length > 1 ? 's' : ''} proche{alertes.length > 1 ? 's' : ''} ou en dépassement
          </div>
          <ul className="list-disc list-inside text-sm">
            {alertes.map((a, i) => (
              <li key={pick(a, ['id'], i)}>{pick(a, ['service', 'departement'], 'Budget')} — {pick(a, ['montantPrevu'])} GNF prévu</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-xs w-full">
          <Select id="annee" label="Année scolaire" options={anneeOptions} value={anneeScolaireId} onChange={(e) => setAnneeScolaireId(e.target.value)} />
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!anneeScolaireId}>
          <Plus className="h-4 w-4" />
          Créer un budget
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les budgets." />}
        {!isLoading && !isError && items.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <PiggyBank className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun budget pour cette année.
          </div>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <div className="divide-y divide-ink-50">
            {items.map((b, index) => (
              <div key={pick(b, ['id'], index)} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{[pick(b, ['service'], ''), pick(b, ['departement'], '')].filter(Boolean).join(' · ') || 'Budget'}</p>
                </div>
                <p className="text-sm font-semibold text-ink-900 shrink-0">{pick(b, ['montantPrevu'])} GNF</p>
              </div>
            ))}
          </div>
        )}

        {data && !Array.isArray(data) && (
          <div className="px-4 pb-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Créer un budget">
        <BudgetForm isSubmitting={createMutation.isPending} onCancel={() => setCreateOpen(false)} onSubmit={(payload) => createMutation.mutateAsync(payload)} />
      </Modal>
    </div>
  )
}
