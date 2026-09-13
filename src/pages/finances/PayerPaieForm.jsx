import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'

/**
 * `PayerPaieDto` exige un `tresorerieId` ("Trésorerie à débiter") mais
 * aucun endpoint n'existe dans la doc pour en lister ou en créer une —
 * champ texte libre en attendant une clarification du backend (signalé).
 */
export function PayerPaieForm({ onCancel, onSubmit, isSubmitting }) {
  const [tresorerieId, setTresorerieId] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ tresorerieId }, { tresorerieId: [rules.required('Requis.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ tresorerieId })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Alert variant="warning">
        Aucun écran de gestion des trésoreries n'existe encore (pas d'endpoint
        documenté pour en lister) — demande l'identifiant exact à utiliser
        ici en attendant.
      </Alert>
      <TextField
        id="tresorerieId"
        label="Identifiant de la trésorerie à débiter"
        value={tresorerieId}
        onChange={(e) => setTresorerieId(e.target.value)}
        error={fieldErrors.tresorerieId}
        required
      />
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Marquer payé
        </Button>
      </div>
    </form>
  )
}
