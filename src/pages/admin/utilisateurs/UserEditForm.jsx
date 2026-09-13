import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { Alert } from '../../../components/ui/Alert'
import { ApiError } from '../../../api/client'
import { rules, validate } from '../../../lib/validate'

const SCHEMA = {
  prenom: [rules.required('Le prénom est requis.')],
  nom: [rules.required('Le nom est requis.')],
}

/**
 * Édition d'un compte existant. L'API (UpdateUserDto) n'autorise que
 * nom/prénom/téléphone ici — l'email, le mot de passe et le rôle ne se
 * changent pas par ce biais (voir Réinitialiser le mot de passe pour l'accès).
 */
export function UserEditForm({ user, onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState({
    prenom: user.prenom ?? '',
    nom: user.nom ?? '',
    telephone: user.telephone ?? '',
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
      await onSubmit(form)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        id="email-readonly"
        label="Adresse e-mail"
        value={user.email}
        disabled
        className="opacity-60"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="prenom"
          label="Prénom"
          required
          value={form.prenom}
          onChange={update('prenom')}
          error={fieldErrors.prenom}
        />
        <TextField
          id="nom"
          label="Nom"
          required
          value={form.nom}
          onChange={update('nom')}
          error={fieldErrors.nom}
        />
      </div>

      <TextField
        id="telephone"
        label="Téléphone"
        value={form.telephone}
        onChange={update('telephone')}
        placeholder="+224620000000"
      />

      <p className="text-xs text-ink-400">
        L'email et le rôle ne sont pas modifiables ici. Pour changer l'accès,
        utilise "Réinitialiser" (mot de passe) depuis la liste.
      </p>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Enregistrer les modifications
        </Button>
      </div>
    </form>
  )
}
