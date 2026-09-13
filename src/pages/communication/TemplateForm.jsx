import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { CANAL_OPTIONS, TEMPLATE_CODE_OPTIONS } from '../../config/communicationLabels'
import { rules, validate } from '../../lib/validate'

/**
 * Création (`CreateTemplateDto` : code+canal+sujet?+contenu) ou modification
 * (`UpdateTemplateDto` : sujet?+contenu seulement — code/canal fixes après coup).
 */
export function TemplateForm({ initialValues, onCancel, onSubmit, isSubmitting }) {
  const isEdit = Boolean(initialValues)
  const [code, setCode] = useState(initialValues?.code ?? TEMPLATE_CODE_OPTIONS[0].value)
  const [canal, setCanal] = useState(initialValues?.canal ?? 'EMAIL')
  const [sujet, setSujet] = useState(initialValues?.sujet ?? '')
  const [contenu, setContenu] = useState(initialValues?.contenu ?? '')
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ contenu }, { contenu: [rules.required('Le contenu est requis.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = isEdit
      ? { ...(sujet ? { sujet } : {}), contenu }
      : { code, canal, ...(sujet ? { sujet } : {}), contenu }

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select id="code" label="Type de message" options={TEMPLATE_CODE_OPTIONS} value={code} onChange={(e) => setCode(e.target.value)} disabled={isEdit} required />
        <Select id="canal" label="Canal" options={CANAL_OPTIONS} value={canal} onChange={(e) => setCanal(e.target.value)} disabled={isEdit} required />
      </div>
      <TextField id="sujet" label="Sujet (optionnel)" value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Rappel de paiement" />
      <div>
        <label htmlFor="contenu" className="block text-sm font-medium text-ink-700 mb-1.5">
          Contenu<span className="text-danger-500"> *</span>
        </label>
        <textarea
          id="contenu"
          rows={4}
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder="Bonjour {parent}, rappel pour {eleve}..."
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
        />
        {fieldErrors.contenu && <p className="text-xs text-danger-600 mt-1.5">{fieldErrors.contenu}</p>}
        <p className="text-xs text-ink-400 mt-1.5">Variables disponibles : {'{parent}'}, {'{eleve}'}...</p>
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? 'Enregistrer' : 'Créer le modèle'}
        </Button>
      </div>
    </form>
  )
}
