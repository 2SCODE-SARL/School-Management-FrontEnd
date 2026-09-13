import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { ROLE_CODE_OPTIONS } from '../../config/rbacLabels'

/** `CreateRoleDto` : code (enum des 8 profils), libelle*. */
export function RoleForm({ onSubmit, onCancel, isSubmitting }) {
  const [code, setCode] = useState(ROLE_CODE_OPTIONS[0].value)
  const [libelle, setLibelle] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ libelle }, { libelle: [rules.required('Le libellé est requis.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ code, libelle })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Select id="code" label="Profil" options={ROLE_CODE_OPTIONS} value={code} onChange={(e) => setCode(e.target.value)} required />
      <TextField id="libelle" label="Libellé" required value={libelle} onChange={(e) => setLibelle(e.target.value)} error={fieldErrors.libelle} placeholder="Directeur général" />
      <p className="text-xs text-ink-400">
        Le profil (rôle backend réel) est fixé parmi les 8 du cahier des charges — le libellé personnalise juste son
        affichage.
      </p>

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
