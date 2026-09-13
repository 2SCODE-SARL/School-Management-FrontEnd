import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { listClasseMatieres, listTypesEvaluation } from '../../api/academique'
import { rules, validate } from '../../lib/validate'

/** Crée un examen (devoir/composition...) pour une classe, une matière et un trimestre donnés. */
export function ExamenForm({ etablissementId, classeId, trimestreId, onCancel, onSubmit, isSubmitting }) {
  const [matiereId, setMatiereId] = useState('')
  const [typeEvaluationId, setTypeEvaluationId] = useState('')
  const [intitule, setIntitule] = useState('')
  const [date, setDate] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  const { data: matieresData } = useQuery({
    queryKey: ['academique', 'classe-matieres', etablissementId, classeId],
    queryFn: () => listClasseMatieres(etablissementId, classeId),
    enabled: Boolean(etablissementId && classeId),
  })
  const matieres = Array.isArray(matieresData) ? matieresData : (matieresData?.items ?? [])
  const matiereOptions = matieres.map((m) => ({
    value: m.matiereId ?? m.matiere?.id ?? m.id,
    label: m.matiere?.intitule ?? m.intitule ?? '—',
  }))

  const { data: typesData } = useQuery({
    queryKey: ['academique', 'types-evaluation', etablissementId],
    queryFn: () => listTypesEvaluation(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const types = Array.isArray(typesData) ? typesData : (typesData?.items ?? [])
  const typeOptions = types.map((t) => ({ value: t.id, label: t.libelle }))

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(
      { matiereId, typeEvaluationId, intitule, date },
      {
        matiereId: [rules.required('La matière est requise.')],
        typeEvaluationId: [rules.required("Le type d'évaluation est requis.")],
        intitule: [rules.required("L'intitulé est requis.")],
        date: [rules.required('La date est requise.')],
      },
    )
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ trimestreId, classeId, matiereId, typeEvaluationId, intitule, date })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Select
        id="matiereId"
        label="Matière"
        options={[{ value: '', label: matiereOptions.length ? 'Choisir une matière...' : 'Aucune matière pour cette classe' }, ...matiereOptions]}
        value={matiereId}
        onChange={(e) => setMatiereId(e.target.value)}
        error={fieldErrors.matiereId}
        required
      />
      <Select
        id="typeEvaluationId"
        label="Type d'évaluation"
        options={[{ value: '', label: typeOptions.length ? 'Choisir un type...' : 'Aucun type configuré' }, ...typeOptions]}
        value={typeEvaluationId}
        onChange={(e) => setTypeEvaluationId(e.target.value)}
        error={fieldErrors.typeEvaluationId}
        required
      />
      <TextField
        id="intitule"
        label="Intitulé"
        value={intitule}
        onChange={(e) => setIntitule(e.target.value)}
        error={fieldErrors.intitule}
        placeholder="Devoir n°1 — Fractions"
        required
      />
      <TextField
        id="date"
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        error={fieldErrors.date}
        required
      />

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Créer l'examen
        </Button>
      </div>
    </form>
  )
}
