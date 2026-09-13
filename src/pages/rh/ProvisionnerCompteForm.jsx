import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { EMPLOYE_TYPE_TO_DEFAULT_ROLE } from '../../config/rhLabels'
import { CompteEmployeFields } from './CompteEmployeFields'

/** Provisionne un compte de connexion pour une fiche Employé existante qui n'en a pas encore. */
export function ProvisionnerCompteForm({ employeType, onSubmit, onCancel, isSubmitting }) {
  const [compte, setCompte] = useState({
    email: '',
    password: '',
    roleCode: EMPLOYE_TYPE_TO_DEFAULT_ROLE[employeType] ?? 'SECRETAIRE',
    telephone: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const validationErrors = validate(compte, {
      email: [rules.required("L'email est requis."), rules.email()],
      password: [rules.required('Le mot de passe est requis.'), rules.minLength(8)],
    })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    try {
      const payload = Object.fromEntries(Object.entries(compte).filter(([, v]) => v !== ''))
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <CompteEmployeFields value={compte} onChange={setCompte} errors={errors} />
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Provisionner
        </Button>
      </div>
    </form>
  )
}
