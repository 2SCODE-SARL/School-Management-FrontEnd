import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { TextField } from '../../../components/ui/TextField'
import { Alert } from '../../../components/ui/Alert'
import { ApiError } from '../../../api/client'
import { TYPE_CONTRAT_OPTIONS } from '../../../config/rhLabels'
import { rules, validate } from '../../../lib/validate'

/**
 * `CreateEmployeFromUserDto` : rattache un compte Utilisateur EXISTANT (qui
 * n'a pas encore de fiche RH — ex: un Directeur créé avant ce workflow) à
 * un nouveau dossier Employé + DossierPaie, sans créer de second compte.
 * 409 si ce compte a déjà un employé lié.
 */
export function RattacherEmployeForm({ onCancel, onSubmit, isSubmitting }) {
  const [typeContrat, setTypeContrat] = useState('PERMANENT')
  const [salaireBase, setSalaireBase] = useState('')
  const [maxHeuresHebdo, setMaxHeuresHebdo] = useState('')
  const [dateEmbauche, setDateEmbauche] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ typeContrat }, { typeContrat: [rules.required('Le type de contrat est requis.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = { typeContrat }
    if (salaireBase !== '') payload.salaireBase = Number(salaireBase)
    if (maxHeuresHebdo !== '') payload.maxHeuresHebdo = Number(maxHeuresHebdo)
    if (dateEmbauche) payload.dateEmbauche = dateEmbauche

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-ink-600">
        Crée un dossier RH (Employé + Dossier de paie) pour ce compte existant, sans créer de second compte de connexion.
      </p>
      <Select
        id="typeContrat"
        label="Type de contrat"
        options={TYPE_CONTRAT_OPTIONS}
        value={typeContrat}
        onChange={(e) => setTypeContrat(e.target.value)}
        error={fieldErrors.typeContrat}
        required
      />
      <TextField
        id="salaireBase"
        label="Salaire de base (optionnel)"
        type="number"
        value={salaireBase}
        onChange={(e) => setSalaireBase(e.target.value)}
        placeholder="3000000"
      />
      <TextField
        id="maxHeuresHebdo"
        label="Heures max / semaine (optionnel)"
        type="number"
        value={maxHeuresHebdo}
        onChange={(e) => setMaxHeuresHebdo(e.target.value)}
        placeholder="40"
      />
      <TextField
        id="dateEmbauche"
        label="Date d'embauche (optionnel)"
        type="date"
        value={dateEmbauche}
        onChange={(e) => setDateEmbauche(e.target.value)}
      />

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Créer le dossier employé
        </Button>
      </div>
    </form>
  )
}
