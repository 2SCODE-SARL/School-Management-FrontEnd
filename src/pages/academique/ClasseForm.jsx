import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { listSeries } from '../../api/academique'
import { rules, validate } from '../../lib/validate'

const NO_SERIE_OPTION = { value: '', label: 'Aucune (niveau sans série)' }
const NO_SALLE_OPTION = { value: '', label: 'Aucune salle attitrée' }

/**
 * Formulaire de classe. La série dépend du niveau choisi, donc on ne peut
 * pas passer par DynamicForm (champs statiques) : on recharge les séries
 * dès que le niveau change.
 *
 * En édition, le niveau n'est pas modifiable (absent d'UpdateClasseDto) —
 * on garde juste son id pour proposer les bonnes séries.
 */
export function ClasseForm({
  etablissementId,
  anneeScolaireId,
  niveauOptions,
  salleOptions,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const isEdit = Boolean(initialValues)
  const [niveauId, setNiveauId] = useState(
    isEdit ? (initialValues.niveau?.id ?? initialValues.niveauId ?? '') : (niveauOptions[0]?.value ?? ''),
  )
  const [form, setForm] = useState(() => ({
    nom: initialValues?.nom ?? '',
    capaciteMax: initialValues?.capaciteMax ?? '',
    serieId: initialValues?.serie?.id ?? initialValues?.serieId ?? '',
    salleId: initialValues?.salle?.id ?? initialValues?.salleId ?? '',
    actif: initialValues?.actif ?? true,
  }))
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  const { data: seriesData } = useQuery({
    queryKey: ['academique', 'series', etablissementId, niveauId],
    queryFn: () => listSeries(etablissementId, niveauId),
    enabled: Boolean(etablissementId && niveauId),
  })
  const series = Array.isArray(seriesData) ? seriesData : (seriesData?.items ?? [])
  const serieOptions = [
    NO_SERIE_OPTION,
    ...series.map((s) => ({ value: s.id, label: s.libelle })),
  ]

  function update(field) {
    return (e) => {
      const value = field === 'actif' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate({ ...form, niveauId }, {
      nom: [rules.required('Le nom de la classe est requis.')],
      capaciteMax: [rules.required('La capacité maximale est requise.'), rules.integer(), rules.min(1)],
      ...(isEdit ? {} : { niveauId: [rules.required('Le niveau est requis.')] }),
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = {
      nom: form.nom,
      capaciteMax: Number(form.capaciteMax),
      ...(form.serieId ? { serieId: form.serieId } : {}),
      ...(form.salleId ? { salleId: form.salleId } : {}),
    }
    if (!isEdit) {
      payload.anneeScolaireId = anneeScolaireId
      payload.niveauId = niveauId
    } else {
      payload.actif = form.actif
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {!isEdit && (
        <Select
          id="niveauId"
          label="Niveau"
          options={niveauOptions}
          value={niveauId}
          onChange={(e) => {
            setNiveauId(e.target.value)
            setForm((f) => ({ ...f, serieId: '' }))
          }}
          error={fieldErrors.niveauId}
          required
        />
      )}

      <TextField
        id="nom"
        label="Nom de la classe"
        required
        value={form.nom}
        onChange={update('nom')}
        error={fieldErrors.nom}
        placeholder="6ème A"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="capaciteMax"
          label="Capacité maximale"
          type="number"
          required
          value={form.capaciteMax}
          onChange={update('capaciteMax')}
          error={fieldErrors.capaciteMax}
          placeholder="45"
        />
        <Select
          id="serieId"
          label="Série"
          options={serieOptions}
          value={form.serieId}
          onChange={update('serieId')}
        />
      </div>

      <Select
        id="salleId"
        label="Salle principale"
        options={[NO_SALLE_OPTION, ...salleOptions]}
        value={form.salleId}
        onChange={update('salleId')}
      />

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={form.actif}
            onChange={update('actif')}
            className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
          />
          Classe active
        </label>
      )}

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? 'Enregistrer les modifications' : 'Créer la classe'}
        </Button>
      </div>
    </form>
  )
}
