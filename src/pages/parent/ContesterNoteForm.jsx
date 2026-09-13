import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'

/** `DemanderCorrectionDto` : eleveId (déjà connu), motif*, detail?. */
export function ContesterNoteForm({ onCancel, onSubmit, isSubmitting }) {
  const [motif, setMotif] = useState('')
  const [detail, setDetail] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ motif }, { motif: [rules.required('Le motif est requis.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ motif, ...(detail ? { detail } : {}) })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        id="motif"
        label="Motif"
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        error={fieldErrors.motif}
        placeholder="Note erronée"
        required
      />
      <div>
        <label htmlFor="detail" className="block text-sm font-medium text-ink-700 mb-1.5">
          Détail (optionnel)
        </label>
        <textarea
          id="detail"
          rows={3}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Explique la raison de ta contestation..."
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
        />
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Envoyer la contestation
        </Button>
      </div>
    </form>
  )
}
