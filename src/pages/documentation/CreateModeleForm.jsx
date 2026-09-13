import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { MODELE_CODE_OPTIONS } from '../../config/documentationLabels'

const EMPTY_FORM = {
  code: MODELE_CODE_OPTIONS[0].value,
  libelle: '',
  logoUrl: '',
  signatureUrl: '',
  piedPage: '',
  numerotationAuto: false,
  formatNumero: '',
}

/** `CreateModeleDocumentDto` : code (enum) + libelle requis. */
export function CreateModeleForm({ onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate(form, { libelle: [rules.required('Le libellé est requis.')] })
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
      <Select id="code" label="Type de modèle" options={MODELE_CODE_OPTIONS} value={form.code} onChange={update('code')} required />
      <TextField id="libelle" label="Libellé" required value={form.libelle} onChange={update('libelle')} error={fieldErrors.libelle} placeholder="Bulletin trimestriel" />
      <TextField id="logoUrl" label="URL du logo (optionnel)" value={form.logoUrl} onChange={update('logoUrl')} />
      <TextField id="signatureUrl" label="URL de la signature (optionnel)" value={form.signatureUrl} onChange={update('signatureUrl')} />
      <TextField id="formatNumero" label="Format de numérotation (optionnel)" value={form.formatNumero} onChange={update('formatNumero')} placeholder="BUL-{annee}-{seq}" />

      <div>
        <label htmlFor="piedPage" className="block text-sm font-medium text-ink-700 mb-1.5">
          Pied de page (optionnel)
        </label>
        <textarea
          id="piedPage"
          rows={2}
          value={form.piedPage}
          onChange={update('piedPage')}
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
        />
      </div>

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={form.numerotationAuto}
          onChange={update('numerotationAuto')}
          className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-ink-700">Numérotation automatique</span>
      </label>

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
