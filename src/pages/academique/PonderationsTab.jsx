import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, PieChart } from 'lucide-react'
import { listPonderations, listTypesEvaluation, setPonderations } from '../../api/academique'
import { listAnneesScolaires } from '../../api/etablissements'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { TYPE_EVALUATION_CODE_LABELS } from '../../config/academiqueLabels'
import { ApiError } from '../../api/client'

/**
 * Pondérations : poids (0 à 1) de chaque type d'évaluation dans le calcul
 * de la moyenne, définis pour une année scolaire donnée. `POST .../ponderations`
 * remplace l'ensemble de la configuration de l'année (pas un patch partiel),
 * donc un seul bouton "Enregistrer" pour tout le tableau plutôt qu'une
 * sauvegarde ligne par ligne.
 */
export function PonderationsTab({ etablissementId }) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [values, setValues] = useState({})
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data: anneesData, isLoading: isLoadingAnnees } = useQuery({
    queryKey: ['academique', 'annees', etablissementId],
    queryFn: () => listAnneesScolaires(etablissementId),
  })
  const annees = Array.isArray(anneesData) ? anneesData : (anneesData?.items ?? [])
  const anneeOptions = annees.map((a) => ({ value: a.id, label: a.libelle }))

  // Un id d'année d'un AUTRE établissement ne doit jamais survivre à un
  // changement d'établissement (confirmé par le backend : sinon "année
  // scolaire introuvable" pour ce tenant).
  useEffect(() => {
    setAnneeScolaireId('')
  }, [etablissementId])

  useEffect(() => {
    if (anneeScolaireId || annees.length === 0) return
    const enCours = annees.find((a) => a.statut === 'EN_COURS')
    const fallback = annees
      .slice()
      .sort((a, b) => (b.dateDebut ?? '').localeCompare(a.dateDebut ?? ''))[0]
    setAnneeScolaireId((enCours ?? fallback)?.id ?? '')
  }, [annees, anneeScolaireId])

  const { data: typesData } = useQuery({
    queryKey: ['academique', 'types-evaluation', etablissementId],
    queryFn: () => listTypesEvaluation(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const types = Array.isArray(typesData) ? typesData : (typesData?.items ?? [])

  const ponderationsQueryKey = ['academique', 'ponderations', etablissementId, anneeScolaireId]
  const { data: ponderationsData, isLoading: isLoadingPonderations } = useQuery({
    queryKey: ponderationsQueryKey,
    queryFn: () => listPonderations(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })

  // Recharge les valeurs affichées à chaque changement d'année ou de
  // pondérations déjà enregistrées côté serveur.
  useEffect(() => {
    if (!typesData) return
    const existing = Array.isArray(ponderationsData) ? ponderationsData : (ponderationsData?.items ?? [])
    const poidsByTypeId = Object.fromEntries(
      existing.map((p) => [p.typeEvaluationId ?? p.typeEvaluation?.id, p.poids]),
    )
    setValues(
      Object.fromEntries(
        types.map((t) => [t.id, poidsByTypeId[t.id] !== undefined ? String(poidsByTypeId[t.id]) : '']),
      ),
    )
    setFormError('')
  }, [typesData, ponderationsData])

  const saveMutation = useMutation({
    mutationFn: (items) => setPonderations(etablissementId, anneeScolaireId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ponderationsQueryKey })
    },
  })

  const sum = Object.values(values).reduce((total, v) => total + (v === '' ? 0 : Number(v)), 0)

  function handleChange(typeId, value) {
    setValues((v) => ({ ...v, [typeId]: value }))
    setFormError('')
  }

  async function handleSave() {
    setFormError('')
    const items = types
      .filter((t) => values[t.id] !== '')
      .map((t) => ({ typeEvaluationId: t.id, poids: Number(values[t.id]) }))

    if (items.length === 0) {
      setFormError('Renseigne au moins un poids avant d\'enregistrer.')
      return
    }

    try {
      await saveMutation.mutateAsync(items)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  if (!isLoadingAnnees && annees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-warning-500/40 p-10 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-warning-500" />
        <p className="font-heading font-semibold text-ink-900 mb-1">Aucune année scolaire</p>
        <p className="text-sm text-ink-500 max-w-md mx-auto">
          Crée d'abord une année scolaire dans l'onglet "Années scolaires" — les
          pondérations lui sont rattachées.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-xs mb-4">
        <Select
          id="annee-filter"
          label="Année scolaire"
          options={anneeOptions}
          value={anneeScolaireId}
          onChange={(e) => setAnneeScolaireId(e.target.value)}
        />
      </div>

      {types.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-12 text-center text-ink-400">
          Crée d'abord au moins un type d'évaluation dans l'onglet "Types d'évaluation".
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-100 p-5">
          {isLoadingPonderations ? (
            <div className="p-8 flex justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {types.map((t) => (
                  <div key={t.id} className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900">{t.libelle}</p>
                      <p className="text-xs text-ink-400">
                        {TYPE_EVALUATION_CODE_LABELS[t.code] ?? t.code}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={values[t.id] ?? ''}
                      onChange={(e) => handleChange(t.id, e.target.value)}
                      placeholder="0.30"
                      className="w-28 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 text-right outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-ink-100">
                <p className={`text-sm font-medium ${Math.abs(sum - 1) < 0.001 ? 'text-success-600' : 'text-warning-600'}`}>
                  Total : {sum.toFixed(2)} {Math.abs(sum - 1) < 0.001 ? '✓' : '(attendu : 1.00)'}
                </p>
                <Button size="sm" onClick={handleSave} isLoading={saveMutation.isPending}>
                  <PieChart className="h-3.5 w-3.5" />
                  Enregistrer
                </Button>
              </div>

              {formError && (
                <Alert variant="danger" className="mt-3">
                  {formError}
                </Alert>
              )}
              {saveMutation.isSuccess && !formError && (
                <Alert variant="success" className="mt-3">
                  Pondérations enregistrées.
                </Alert>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
