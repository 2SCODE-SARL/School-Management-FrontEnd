import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import {
  TRAINING_NATIONAL_EXAM_TYPE_OPTIONS,
  TRAINING_PROFESSIONAL_LEVEL_OPTIONS,
  TRAINING_PRODUCT_TYPE_OPTIONS,
} from '../../config/trainingLabels'

const EMPTY_FORM = {
  providerId: '',
  type: '',
  nationalExamType: '',
  titre: '',
  description: '',
  targetCountryId: '',
  languageId: '',
  currencyId: '',
  professionalLevel: '',
}

const EMPTY_OPTION = { value: '', label: 'Choisir...' }

/**
 * Création d'un cours (CreateTrainingLearningProductDto) — champs essentiels
 * seulement (titre, classification, pays/langue/devise) ; description
 * détaillée, compétences, prérequis etc. restent à ajouter plus tard via
 * modification (pas construit pour l'instant, hors périmètre de ce premier jet).
 */
export function CreateProductForm({
  providerOptions,
  countryOptions,
  languageOptions,
  currencyOptions,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
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
      providerId: [rules.required('Le prestataire est requis.')],
      type: [rules.required('Le type de formation est requis.')],
      titre: [rules.required('Le titre est requis.')],
      targetCountryId: [rules.required('Le pays cible est requis.')],
      languageId: [rules.required('La langue est requise.')],
      currencyId: [rules.required('La devise est requise.')],
      ...(form.type === 'EXAM_PREPARATION'
        ? { nationalExamType: [rules.required("Le type d'examen est requis.")] }
        : {}),
    }
    const errors = validate(form, rulesSchema)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
      if (form.type !== 'EXAM_PREPARATION') delete payload.nationalExamType
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Select
        id="providerId"
        label="Prestataire"
        options={[EMPTY_OPTION, ...providerOptions]}
        value={form.providerId}
        onChange={update('providerId')}
        error={fieldErrors.providerId}
        required
      />
      <Select
        id="type"
        label="Type de formation"
        options={[EMPTY_OPTION, ...TRAINING_PRODUCT_TYPE_OPTIONS]}
        value={form.type}
        onChange={update('type')}
        error={fieldErrors.type}
        required
      />
      {form.type === 'EXAM_PREPARATION' && (
        <Select
          id="nationalExamType"
          label="Examen visé"
          options={[EMPTY_OPTION, ...TRAINING_NATIONAL_EXAM_TYPE_OPTIONS]}
          value={form.nationalExamType}
          onChange={update('nationalExamType')}
          error={fieldErrors.nationalExamType}
          required
        />
      )}
      <TextField
        id="titre"
        label="Titre"
        value={form.titre}
        onChange={update('titre')}
        error={fieldErrors.titre}
        placeholder="Mathématiques — Terminale"
        required
      />
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink-700 mb-1.5">
          Description (optionnel)
        </label>
        <textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={update('description')}
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          id="targetCountryId"
          label="Pays cible"
          options={[EMPTY_OPTION, ...countryOptions]}
          value={form.targetCountryId}
          onChange={update('targetCountryId')}
          error={fieldErrors.targetCountryId}
          required
        />
        <Select
          id="languageId"
          label="Langue"
          options={[EMPTY_OPTION, ...languageOptions]}
          value={form.languageId}
          onChange={update('languageId')}
          error={fieldErrors.languageId}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          id="currencyId"
          label="Devise"
          options={[EMPTY_OPTION, ...currencyOptions]}
          value={form.currencyId}
          onChange={update('currencyId')}
          error={fieldErrors.currencyId}
          required
        />
        <Select
          id="professionalLevel"
          label="Niveau (optionnel)"
          options={[EMPTY_OPTION, ...TRAINING_PROFESSIONAL_LEVEL_OPTIONS]}
          value={form.professionalLevel}
          onChange={update('professionalLevel')}
        />
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Créer le cours
        </Button>
      </div>
    </form>
  )
}
