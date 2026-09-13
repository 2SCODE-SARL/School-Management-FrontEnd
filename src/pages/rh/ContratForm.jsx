import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { CONTRAT_TYPE_OPTIONS } from '../../config/rhLabels'
import { rules, validate } from '../../lib/validate'

/** Crée un contrat (CDI/CDD/Stage) pour un employé — sert de source de rémunération à la paie. */
export function ContratForm({ employeId, onCancel, onSubmit, isSubmitting }) {
  const [type, setType] = useState('CDI')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [salaire, setSalaire] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(
      { type, dateDebut, salaire },
      {
        type: [rules.required('Le type est requis.')],
        dateDebut: [rules.required('La date de début est requise.')],
        salaire: [rules.required('Le salaire est requis.')],
      },
    )
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = { employeId, type, dateDebut, salaire: Number(salaire) }
    if (dateFin) payload.dateFin = dateFin

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Select
        id="type"
        label="Type de contrat"
        options={CONTRAT_TYPE_OPTIONS}
        value={type}
        onChange={(e) => setType(e.target.value)}
        error={fieldErrors.type}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          id="dateDebut"
          label="Date de début"
          type="date"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          error={fieldErrors.dateDebut}
          required
        />
        <TextField
          id="dateFin"
          label="Date de fin (optionnel)"
          type="date"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
        />
      </div>
      <TextField
        id="salaire"
        label="Salaire (GNF)"
        type="number"
        value={salaire}
        onChange={(e) => setSalaire(e.target.value)}
        error={fieldErrors.salaire}
        placeholder="3000000"
        required
      />

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Créer le contrat
        </Button>
      </div>
    </form>
  )
}
