import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'

/** `CreerDemandeParentaleDto` : etablissementId, eleveId, sujet, description (motifId optionnel, pas de liste dispo). */
export function DemandeForm({ enfantOptions, onCancel, onSubmit, isSubmitting }) {
  const [eleveId, setEleveId] = useState(enfantOptions[0]?.value ?? '')
  const [sujet, setSujet] = useState('')
  const [description, setDescription] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate(
      { eleveId, sujet, description },
      {
        eleveId: [rules.required("Choisis l'enfant concerné.")],
        sujet: [rules.required('Le sujet est requis.')],
        description: [rules.required('La description est requise.')],
      },
    )
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ eleveId, sujet, description })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Select
        id="eleveId"
        label="Enfant concerné"
        options={enfantOptions}
        value={eleveId}
        onChange={(e) => setEleveId(e.target.value)}
        error={fieldErrors.eleveId}
        required
      />
      <TextField
        id="sujet"
        label="Sujet"
        value={sujet}
        onChange={(e) => setSujet(e.target.value)}
        error={fieldErrors.sujet}
        placeholder="Demande de certificat de scolarité"
        required
      />
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink-700 mb-1.5">
          Description<span className="text-danger-500"> *</span>
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décris ta demande..."
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
        />
        {fieldErrors.description && <p className="text-xs text-danger-600 mt-1.5">{fieldErrors.description}</p>}
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Envoyer la demande
        </Button>
      </div>
    </form>
  )
}
