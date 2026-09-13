import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { Select } from '../../../components/ui/Select'
import { Alert } from '../../../components/ui/Alert'
import { ApiError } from '../../../api/client'
import { rules, validate } from '../../../lib/validate'

const DEVISES = [
  { value: 'GNF', label: 'Franc guinéen (GNF)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'Dollar (USD)' },
]

const EMPTY_FORM = {
  code: '',
  nom: '',
  slogan: '',
  adresse: '',
  region: '',
  prefecture: '',
  telephone: '',
  email: '',
  siteWeb: '',
  numeroAgrement: '',
  devise: 'GNF',
}

// Reprend exactement les contraintes du backend (Create/UpdateEtablissementDto).
const SCHEMA = {
  code: [rules.required('Le code est requis.'), rules.maxLength(30)],
  nom: [rules.required("Le nom de l'établissement est requis."), rules.maxLength(200)],
  email: [rules.email()],
}

/**
 * Formulaire de création OU édition d'un établissement.
 * En édition (`initialValues` fourni), le code n'est pas modifiable
 * (absent de UpdateEtablissementDto).
 */
export function EtablissementForm({ onSubmit, onCancel, isSubmitting, initialValues }) {
  const isEdit = Boolean(initialValues)
  // On ne garde QUE les champs qu'on gère — jamais id/createdAt/updatedAt/...
  // renvoyés par la liste, sinon le backend les rejette ("property X should
  // not exist", UpdateEtablissementDto ne les connaît pas).
  const [form, setForm] = useState(() => {
    const base = { ...EMPTY_FORM }
    if (initialValues) {
      for (const key of Object.keys(EMPTY_FORM)) {
        if (initialValues[key] !== undefined && initialValues[key] !== null) {
          base[key] = initialValues[key]
        }
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

    const errors = validate(form, SCHEMA)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      const { code, ...rest } = form
      const payload = isEdit ? rest : form
      const cleaned = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== ''),
      )
      await onSubmit(cleaned)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="code"
          label="Code établissement"
          required
          disabled={isEdit}
          value={form.code}
          onChange={update('code')}
          error={fieldErrors.code}
          placeholder="CODES-2S"
          className={isEdit ? 'opacity-60' : ''}
        />
        <Select
          id="devise"
          label="Devise"
          options={DEVISES}
          value={form.devise}
          onChange={update('devise')}
          required
        />
      </div>

      <TextField
        id="nom"
        label="Nom de l'établissement"
        required
        value={form.nom}
        onChange={update('nom')}
        error={fieldErrors.nom}
        placeholder="Complexe Scolaire Les Codes"
      />

      <TextField
        id="slogan"
        label="Slogan"
        value={form.slogan}
        onChange={update('slogan')}
        placeholder="Savoir, Excellence, Réussite"
      />

      <TextField
        id="adresse"
        label="Adresse"
        value={form.adresse}
        onChange={update('adresse')}
        placeholder="Conakry, Ratoma"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="region"
          label="Région"
          value={form.region}
          onChange={update('region')}
          placeholder="Conakry"
        />
        <TextField
          id="prefecture"
          label="Préfecture"
          value={form.prefecture}
          onChange={update('prefecture')}
          placeholder="Ratoma"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="telephone"
          label="Téléphone"
          value={form.telephone}
          onChange={update('telephone')}
          placeholder="+224620000000"
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={update('email')}
          error={fieldErrors.email}
          placeholder="contact@ecole.gn"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="siteWeb"
          label="Site web"
          value={form.siteWeb}
          onChange={update('siteWeb')}
          placeholder="https://ecole.gn"
        />
        <TextField
          id="numeroAgrement"
          label="Numéro d'agrément"
          value={form.numeroAgrement}
          onChange={update('numeroAgrement')}
          placeholder="A/2026/001"
        />
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? 'Enregistrer les modifications' : "Créer l'établissement"}
        </Button>
      </div>
    </form>
  )
}
