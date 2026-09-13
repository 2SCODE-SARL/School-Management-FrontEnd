import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Receipt } from 'lucide-react'
import { createTypeFrais, listTypesFrais, setTypeFraisActif } from '../../api/finances'
import { listAnneesScolaires } from '../../api/etablissements'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { PERIODICITE_LABELS, PERIODICITE_OPTIONS, TYPE_FRAIS_CODE_LABELS, TYPE_FRAIS_CODE_OPTIONS } from '../../config/financesLabels'
import { ReductionsTab } from './ReductionsTab'

const EMPTY_FORM = { code: TYPE_FRAIS_CODE_OPTIONS[0].value, libelle: '', montant: '', periodicite: PERIODICITE_OPTIONS[0].value }

function TypeFraisForm({ onSubmit, onCancel, isSubmitting }) {
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
      libelle: [rules.required('Le libellé est requis.')],
      montant: [rules.required('Le montant est requis.')],
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ ...form, montant: Number(form.montant) })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select id="code" label="Type de frais" options={TYPE_FRAIS_CODE_OPTIONS} value={form.code} onChange={update('code')} required />
        <Select id="periodicite" label="Périodicité" options={PERIODICITE_OPTIONS} value={form.periodicite} onChange={update('periodicite')} required />
      </div>
      <TextField id="libelle" label="Libellé" required value={form.libelle} onChange={update('libelle')} error={fieldErrors.libelle} placeholder="Frais de scolarité" />
      <TextField id="montant" label="Montant (GNF)" type="number" required value={form.montant} onChange={update('montant')} error={fieldErrors.montant} placeholder="500000" />

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

/** Types de frais + Réductions/bourses — configuration financière, Admin/Directeur. */
export function TypesFraisTab({ etablissementId }) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
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

  const queryKey = ['finances', 'types-frais', etablissementId, anneeScolaireId]
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listTypesFrais(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })
  const types = Array.isArray(data) ? data : (data?.items ?? [])

  const createMutation = useMutation({
    mutationFn: (payload) => createTypeFrais(etablissementId, { ...payload, anneeScolaireId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setCreateOpen(false)
    },
  })

  const actifMutation = useMutation({
    mutationFn: ({ id, actif }) => setTypeFraisActif(etablissementId, id, actif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div className="max-w-xs w-full">
            <Select id="annee" label="Année scolaire" options={anneeOptions} value={anneeScolaireId} onChange={(e) => setAnneeScolaireId(e.target.value)} />
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled={!anneeScolaireId}>
            <Plus className="h-4 w-4" />
            Créer un type de frais
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
          {isLoading && (
            <div className="p-12 flex justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
            </div>
          )}
          {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les types de frais.</p>}
          {!isLoading && !isError && types.length === 0 && (
            <div className="p-16 text-center text-ink-400">
              <Receipt className="h-8 w-8 mx-auto mb-3 opacity-50" />
              Aucun type de frais pour cette année.
            </div>
          )}
          {!isLoading && !isError && types.length > 0 && (
            <div className="divide-y divide-ink-50">
              {types.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{t.libelle}</p>
                    <p className="text-xs text-ink-400">
                      {TYPE_FRAIS_CODE_LABELS[t.code] ?? t.code} · {PERIODICITE_LABELS[t.periodicite] ?? t.periodicite} · {t.montant} GNF
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={t.actif === false ? 'neutral' : 'success'}>{t.actif === false ? 'Inactif' : 'Actif'}</Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                      isLoading={actifMutation.isPending && actifMutation.variables?.id === t.id}
                      onClick={() => actifMutation.mutate({ id: t.id, actif: t.actif === false })}
                    >
                      {t.actif === false ? 'Activer' : 'Désactiver'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-ink-100">
        <h2 className="font-heading text-lg font-semibold text-ink-900 mb-4">Réductions & bourses</h2>
        <ReductionsTab etablissementId={etablissementId} />
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Créer un type de frais">
        <TypeFraisForm
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>
    </div>
  )
}
