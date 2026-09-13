import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { SEXE_OPTIONS } from '../../config/eleveLabels'

const EMPTY_FORM = {
  prenom: '',
  nom: '',
  dateNaissance: '',
  lieuNaissance: '',
  sexe: 'M',
  quartier: '',
  nationalite: 'Guinéenne',
  telephone: '',
}

const RULES = {
  prenom: [rules.required('Le prénom est requis.')],
  nom: [rules.required('Le nom est requis.')],
  dateNaissance: [rules.required('La date de naissance est requise.')],
  lieuNaissance: [rules.required('Le lieu de naissance est requis.')],
}

/** Formulaire de création OU édition d'un élève. */
export function EleveForm({ onSubmit, onCancel, isSubmitting, initialValues }) {
  const isEdit = Boolean(initialValues)
  const [form, setForm] = useState(() => {
    // On ne garde QUE les champs qu'on gère (jamais id/matricule/statut/
    // parents/... renvoyés par le détail de l'élève) — sinon le backend les
    // rejette ("property X should not exist", UpdateEleveDto ne les connaît
    // pas). Un <input type="date"> exige aussi "AAAA-MM-JJ", pas un
    // timestamp ISO complet.
    const base = { ...EMPTY_FORM }
    if (initialValues) {
      for (const key of Object.keys(EMPTY_FORM)) {
        if (initialValues[key] === undefined || initialValues[key] === null) continue
        base[key] =
          key === 'dateNaissance'
            ? String(initialValues[key]).slice(0, 10)
            : initialValues[key]
      }
    }
    return base
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(form, RULES)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ''),
      )
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="prenom"
          label="Prénom"
          required
          value={form.prenom}
          onChange={update('prenom')}
          error={fieldErrors.prenom}
          placeholder="Abdoulaye"
        />
        <TextField
          id="nom"
          label="Nom"
          required
          value={form.nom}
          onChange={update('nom')}
          error={fieldErrors.nom}
          placeholder="Soumah"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="dateNaissance"
          label="Date de naissance"
          type="date"
          required
          value={form.dateNaissance}
          onChange={update('dateNaissance')}
          error={fieldErrors.dateNaissance}
        />
        <Select
          id="sexe"
          label="Sexe"
          options={SEXE_OPTIONS}
          value={form.sexe}
          onChange={update('sexe')}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="lieuNaissance"
          label="Lieu de naissance"
          required
          value={form.lieuNaissance}
          onChange={update('lieuNaissance')}
          error={fieldErrors.lieuNaissance}
          placeholder="Conakry"
        />
        <TextField
          id="quartier"
          label="Quartier de résidence"
          value={form.quartier}
          onChange={update('quartier')}
          placeholder="Ratoma"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="nationalite"
          label="Nationalité"
          value={form.nationalite}
          onChange={update('nationalite')}
        />
        <TextField
          id="telephone"
          label="Téléphone"
          value={form.telephone}
          onChange={update('telephone')}
          placeholder="+224621000000"
        />
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? 'Enregistrer les modifications' : "Créer l'élève"}
        </Button>
      </div>
    </form>
  )
}
