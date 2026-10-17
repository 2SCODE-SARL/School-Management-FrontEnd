import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'

const EMPTY_FORM = {
  publicName: '',
  nationalityCountryId: '',
  defaultTargetCountryId: '',
  defaultLanguageId: '',
  ville: '',
  specialite: '',
}

/** Création du profil "formateur individuel" (CreateIndividualTrainingProviderDto). */
export function IndividualProviderForm({ countryOptions, languageOptions, onSubmit, onCancel, isSubmitting }) {
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

    const rulesSchema = {
      nationalityCountryId: [rules.required('Le pays de nationalité est requis.')],
      defaultTargetCountryId: [rules.required('Le pays cible est requis.')],
      defaultLanguageId: [rules.required("La langue d'enseignement est requise.")],
      ville: [rules.required('La ville est requise.')],
      specialite: [rules.required('La spécialité est requise.')],
    }
    const errors = validate(form, rulesSchema)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        id="publicName"
        label="Nom public (optionnel)"
        value={form.publicName}
        onChange={update('publicName')}
        placeholder="Par défaut : ton nom et prénom"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          id="nationalityCountryId"
          label="Pays de nationalité"
          options={countryOptions}
          value={form.nationalityCountryId}
          onChange={update('nationalityCountryId')}
          error={fieldErrors.nationalityCountryId}
          required
        />
        <Select
          id="defaultTargetCountryId"
          label="Pays cible par défaut"
          options={countryOptions}
          value={form.defaultTargetCountryId}
          onChange={update('defaultTargetCountryId')}
          error={fieldErrors.defaultTargetCountryId}
          required
        />
      </div>
      <Select
        id="defaultLanguageId"
        label="Langue d'enseignement principale"
        options={languageOptions}
        value={form.defaultLanguageId}
        onChange={update('defaultLanguageId')}
        error={fieldErrors.defaultLanguageId}
        required
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="ville"
          label="Ville"
          value={form.ville}
          onChange={update('ville')}
          error={fieldErrors.ville}
          placeholder="Conakry"
          required
        />
        <TextField
          id="specialite"
          label="Spécialité"
          value={form.specialite}
          onChange={update('specialite')}
          error={fieldErrors.specialite}
          placeholder="Mathématiques appliquées"
          required
        />
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Créer mon profil
        </Button>
      </div>
    </form>
  )
}
