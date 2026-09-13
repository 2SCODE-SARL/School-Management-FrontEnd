import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Combobox } from '../../components/ui/Combobox'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { MOIS_OPTIONS } from '../../config/financesLabels'
import { rules, validate } from '../../lib/validate'

const now = new Date()

/** Génère le bulletin de paie d'un employé pour un mois/année donnés. */
export function GenererPaieForm({ employeOptions, onCancel, onSubmit, isSubmitting }) {
  const [employeId, setEmployeId] = useState('')
  const [mois, setMois] = useState(String(now.getMonth() + 1))
  const [annee, setAnnee] = useState(String(now.getFullYear()))
  const [primes, setPrimes] = useState('')
  const [heuresSup, setHeuresSup] = useState('')
  const [retenues, setRetenues] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(
      { employeId, mois, annee },
      {
        employeId: [rules.required("Choisis l'employé.")],
        mois: [rules.required('Le mois est requis.')],
        annee: [rules.required("L'année est requise.")],
      },
    )
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = { mois: Number(mois), annee: Number(annee) }
    if (primes !== '') payload.primes = Number(primes)
    if (heuresSup !== '') payload.heuresSup = Number(heuresSup)
    if (retenues !== '') payload.retenues = Number(retenues)

    try {
      await onSubmit(employeId, payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Combobox
        id="employeId"
        label="Employé"
        options={employeOptions}
        value={employeId}
        onChange={setEmployeId}
        placeholder="Sélectionner un employé..."
        searchPlaceholder="Rechercher par nom..."
        error={fieldErrors.employeId}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          id="mois"
          label="Mois"
          options={MOIS_OPTIONS.map((m) => ({ value: String(m.value), label: m.label }))}
          value={mois}
          onChange={(e) => setMois(e.target.value)}
          error={fieldErrors.mois}
          required
        />
        <TextField
          id="annee"
          label="Année"
          type="number"
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          error={fieldErrors.annee}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <TextField id="primes" label="Primes (GNF)" type="number" value={primes} onChange={(e) => setPrimes(e.target.value)} placeholder="50000" />
        <TextField id="heuresSup" label="Heures sup. (GNF)" type="number" value={heuresSup} onChange={(e) => setHeuresSup(e.target.value)} placeholder="20000" />
        <TextField id="retenues" label="Retenues (GNF)" type="number" value={retenues} onChange={(e) => setRetenues(e.target.value)} placeholder="10000" />
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Générer le bulletin
        </Button>
      </div>
    </form>
  )
}
