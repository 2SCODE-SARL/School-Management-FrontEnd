import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Plus } from 'lucide-react'
import { createAlerte, listAlertes, marquerAlerteLue } from '../../api/presences'
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
import {
  ALERTE_NIVEAU_LABELS,
  ALERTE_NIVEAU_OPTIONS,
  ALERTE_TYPE_LABELS,
  ALERTE_TYPE_OPTIONS,
  alerteNiveauBadgeVariant,
} from '../../config/presencesLabels'

const LUE_FILTER_OPTIONS = [
  { value: '', label: 'Toutes' },
  { value: 'false', label: 'Non lues' },
  { value: 'true', label: 'Lues' },
]

const PAGE_SIZE = 20

function CreateAlerteForm({ onCancel, onSubmit, isSubmitting }) {
  const [type, setType] = useState(ALERTE_TYPE_OPTIONS[0].value)
  const [niveau, setNiveau] = useState('INFO')
  const [message, setMessage] = useState('')
  const [cibleType, setCibleType] = useState('')
  const [cibleId, setCibleId] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ message }, { message: [rules.required('Le message est requis.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = { type, niveau, message }
    if (cibleType) payload.cibleType = cibleType
    if (cibleId) payload.cibleId = cibleId

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select id="type" label="Type" options={ALERTE_TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} required />
        <Select id="niveau" label="Niveau" options={ALERTE_NIVEAU_OPTIONS} value={niveau} onChange={(e) => setNiveau(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink-700 mb-1.5">
          Message <span className="text-danger-500">*</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors resize-none"
        />
        {fieldErrors.message && <p className="text-xs text-danger-600 mt-1.5">{fieldErrors.message}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField id="cibleType" label="Type de cible (optionnel)" value={cibleType} onChange={(e) => setCibleType(e.target.value)} placeholder="Eleve, Inscription..." />
        <TextField id="cibleId" label="Id de la cible (optionnel)" value={cibleId} onChange={(e) => setCibleId(e.target.value)} />
      </div>
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" isLoading={isSubmitting}>Créer</Button>
      </div>
    </form>
  )
}

/** Alertes internes (absences, impayés, examens...) — création manuelle + suivi lu/non lu. */
export function AlertesTab({ etablissementId }) {
  const [typeFilter, setTypeFilter] = useState('')
  const [lueFilter, setLueFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const queryKey = ['presences', 'alertes', etablissementId, { type: typeFilter, lue: lueFilter }]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listAlertes(etablissementId, { type: typeFilter || undefined, lue: lueFilter || undefined }),
    enabled: Boolean(etablissementId),
  })
  const alertes = Array.isArray(data) ? data : (data?.items ?? [])

  // Pas de `page`/`limit` documentés sur cet endpoint — pagination côté
  // client, ce flux (absences, impayés, anniversaires...) peut grossir vite.
  useEffect(() => {
    setPage(1)
  }, [etablissementId, typeFilter, lueFilter])
  const totalPages = Math.max(1, Math.ceil(alertes.length / PAGE_SIZE))
  const pagedAlertes = alertes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const createMutation = useMutation({
    mutationFn: (payload) => createAlerte(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presences', 'alertes', etablissementId] })
      setCreateOpen(false)
    },
  })

  const marquerLueMutation = useMutation({
    mutationFn: (alerteId) => marquerAlerteLue(etablissementId, alerteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presences', 'alertes', etablissementId] })
    },
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <Select
            id="type-filter"
            label="Type"
            options={[{ value: '', label: 'Tous les types' }, ...ALERTE_TYPE_OPTIONS]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-56"
          />
          <Select
            id="lue-filter"
            label="Statut"
            options={LUE_FILTER_OPTIONS}
            value={lueFilter}
            onChange={(e) => setLueFilter(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Créer une alerte
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les alertes." />}
        {!isLoading && !isError && alertes.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucune alerte.
          </div>
        )}
        {!isLoading && !isError && alertes.length > 0 && (
          <div className="divide-y divide-ink-50">
            {pagedAlertes.map((a, i) => (
              <div key={a.id ?? i} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={alerteNiveauBadgeVariant(a.niveau)}>
                      {ALERTE_NIVEAU_LABELS[a.niveau] ?? a.niveau ?? 'Info'}
                    </Badge>
                    <span className="text-xs text-ink-400">{ALERTE_TYPE_LABELS[a.type] ?? a.type}</span>
                    {a.lue === false && <Badge variant="primary">Non lue</Badge>}
                  </div>
                  <p className="text-sm text-ink-800">{a.message}</p>
                </div>
                {!a.lue && (
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={marquerLueMutation.isPending && marquerLueMutation.variables === a.id}
                    onClick={() => marquerLueMutation.mutate(a.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Marquer lue
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        {!isLoading && !isError && alertes.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} total={alertes.length} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Créer une alerte">
        <CreateAlerteForm
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>
    </div>
  )
}
