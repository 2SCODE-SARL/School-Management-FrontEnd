import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'

const EMPTY_FORM = {
  denomination: '',
  countryId: '',
  adresse: '',
  vatNumber: '',
  contactEmail: '',
}

/** Création du profil "organisme de formation" (CreateOrganizationTrainingProviderDto). */
export function OrganizationProviderForm({ countryOptions, onSubmit, onCancel, isSubmitting }) {
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
      denomination: [rules.required('La dénomination est requise.')],
      countryId: [rules.required('Le pays est requis.')],
      adresse: [rules.required("L'adresse est requise.")],
      vatNumber: [rules.required('Le numéro fiscal est requis.')],
      contactEmail: [rules.required("L'email de contact est requis."), rules.email()],
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
        id="denomination"
        label="Dénomination"
        value={form.denomination}
        onChange={update('denomination')}
        error={fieldErrors.denomination}
        placeholder="Centre Excellence Numérique"
        required
      />
      <Select
        id="countryId"
        label="Pays"
        options={countryOptions}
        value={form.countryId}
        onChange={update('countryId')}
        error={fieldErrors.countryId}
        required
      />
      <TextField
        id="adresse"
        label="Adresse"
        value={form.adresse}
        onChange={update('adresse')}
        error={fieldErrors.adresse}
        placeholder="Kaloum, Conakry"
        required
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="vatNumber"
          label="Numéro fiscal"
          value={form.vatNumber}
          onChange={update('vatNumber')}
          error={fieldErrors.vatNumber}
          placeholder="GN123456789"
          required
        />
        <TextField
          id="contactEmail"
          label="Email de contact"
          type="email"
          value={form.contactEmail}
          onChange={update('contactEmail')}
          error={fieldErrors.contactEmail}
          placeholder="contact@centre.example"
          required
        />
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Créer mon organisme
        </Button>
      </div>
    </form>
  )
}
