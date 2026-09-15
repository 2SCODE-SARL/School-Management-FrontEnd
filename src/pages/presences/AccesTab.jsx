import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LogIn, Plus } from 'lucide-react'
import { listAccesParDate, pointerAcces } from '../../api/presences'
import { searchEleves } from '../../api/eleves'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Combobox } from '../../components/ui/Combobox'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { ACCES_TYPE_LABELS, ACCES_TYPE_OPTIONS } from '../../config/presencesLabels'
import { formatDateTime } from '../../lib/formatDate'
import { rules, validate } from '../../lib/validate'

const today = () => new Date().toISOString().slice(0, 10)

function PointerAccesForm({ eleveOptions, onCancel, onSubmit, isSubmitting }) {
  const [eleveId, setEleveId] = useState('')
  const [type, setType] = useState('ENTREE')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ eleveId }, { eleveId: [rules.required("Choisis l'élève.")] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ eleveId, type, source: 'MANUEL' })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Combobox
        id="eleveId"
        label="Élève"
        options={eleveOptions}
        value={eleveId}
        onChange={setEleveId}
        placeholder="Sélectionner un élève..."
        searchPlaceholder="Rechercher par nom..."
        error={fieldErrors.eleveId}
        required
      />
      <Select id="type" label="Type" options={ACCES_TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} required />
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" isLoading={isSubmitting}>Enregistrer</Button>
      </div>
    </form>
  )
}

/** Entrées/sorties des élèves — pointage manuel côté Surveillant. */
export function AccesTab({ etablissementId }) {
  const [date, setDate] = useState(today())
  const [isPointerOpen, setPointerOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: elevesData } = useQuery({
    queryKey: ['eleves', 'options', etablissementId],
    queryFn: () => searchEleves(etablissementId, { limit: 100 }),
    enabled: Boolean(etablissementId),
  })
  const eleveOptions = (elevesData?.items ?? []).map((e) => ({
    value: e.id,
    label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() + (e.matricule ? ` (${e.matricule})` : ''),
  }))

  const queryKey = ['presences', 'acces', etablissementId, date]
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listAccesParDate(etablissementId, date),
    enabled: Boolean(etablissementId && date),
  })
  const acces = Array.isArray(data) ? data : (data?.items ?? [])

  const pointerMutation = useMutation({
    mutationFn: (payload) => pointerAcces(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setPointerOpen(false)
    },
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <TextField id="date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today()} className="max-w-xs" />
        <Button onClick={() => setPointerOpen(true)} disabled={date > today()}>
          <Plus className="h-4 w-4" />
          Enregistrer un passage
        </Button>
      </div>

      {date > today() && (
        <Alert variant="warning" className="mb-4">
          Impossible d'enregistrer un passage pour une date future.
        </Alert>
      )}

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les pointages.</p>}
        {!isLoading && !isError && acces.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <LogIn className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun passage enregistré pour cette date.
          </div>
        )}
        {!isLoading && !isError && acces.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Élève</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Heure</th>
                </tr>
              </thead>
              <tbody>
                {acces.map((a, i) => (
                  <tr key={a.id ?? i} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {a.eleve ? `${a.eleve.prenom ?? ''} ${a.eleve.nom ?? ''}`.trim() : (eleveOptions.find((o) => o.value === a.eleveId)?.label ?? '—')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={a.type === 'ENTREE' ? 'success' : 'neutral'}>
                        {ACCES_TYPE_LABELS[a.type] ?? a.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{formatDateTime(a.createdAt ?? a.dateHeure) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={isPointerOpen} onClose={() => setPointerOpen(false)} title="Enregistrer un passage">
        <PointerAccesForm
          eleveOptions={eleveOptions}
          isSubmitting={pointerMutation.isPending}
          onCancel={() => setPointerOpen(false)}
          onSubmit={(payload) => pointerMutation.mutateAsync(payload)}
        />
      </Modal>
    </div>
  )
}
