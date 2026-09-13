import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { PARENT_TYPE_OPTIONS } from '../../config/eleveLabels'

const EMPTY_FORM = {
  type: 'PERE',
  nomPrenom: '',
  profession: '',
  telephone: '',
  email: '',
  residence: '',
  lienParente: '',
}

/**
 * Création + rattachement immédiat d'un parent/tuteur qui n'existe PAS
 * encore sur la plateforme. S'il existe déjà ailleurs (autre
 * établissement), utiliser plutôt l'onglet "Déjà sur la plateforme (autre
 * école)" de la modale parente — approche plus fiable (email seul, avec
 * approbation du parent) que de compter sur le rapprochement automatique
 * du backend par nom+email, qui renvoie un 409 "Identité Parent ambiguë"
 * dès que le nom saisi ne correspond pas EXACTEMENT à l'existant.
 */
export function AddParentForm({ onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  const isTuteur = form.type === 'TUTEUR'

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const rulesSchema = {
      nomPrenom: [rules.required('Le nom et prénom sont requis.')],
      email: [rules.required("L'email est requis."), rules.email()],
      telephone: [rules.required('Le téléphone est requis.')],
      ...(isTuteur
        ? { lienParente: [rules.required('Le lien de parenté est requis pour un tuteur.')] }
        : {}),
    }
    const errors = validate(form, rulesSchema)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ''),
      )
      if (!isTuteur) delete payload.lienParente
      await onSubmit(payload)
    } catch (err) {
      // Le backend détecte déjà un email en doublon (409 "Identité Parent
      // ambiguë") mais ne renvoie pas l'id du parent existant — impossible
      // de proposer "lier ce parent" directement, juste d'expliquer la
      // situation (signalé au backend pour qu'ils l'incluent).
      if (err instanceof ApiError && err.statusCode === 409 && /ambigu/i.test(err.message)) {
        setFormError(
          "Un parent avec ce même email existe déjà ailleurs sur la plateforme — impossible de le créer en double. Utilise plutôt l'onglet \"Déjà sur la plateforme (autre école)\" ci-dessus : indique juste son email, il n'aura qu'à approuver depuis son portail.",
        )
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          id="type"
          label="Type"
          options={PARENT_TYPE_OPTIONS}
          value={form.type}
          onChange={update('type')}
          required
        />
        <TextField
          id="nomPrenom"
          label="Nom et prénom"
          required
          value={form.nomPrenom}
          onChange={update('nomPrenom')}
          error={fieldErrors.nomPrenom}
          placeholder="Soumah Abdoulaye"
        />
      </div>

      {isTuteur && (
        <TextField
          id="lienParente"
          label="Lien de parenté"
          required
          value={form.lienParente}
          onChange={update('lienParente')}
          error={fieldErrors.lienParente}
          placeholder="Oncle, grand-père..."
        />
      )}

      <TextField
        id="email"
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={update('email')}
        error={fieldErrors.email}
      />

      <TextField
        id="profession"
        label="Profession"
        value={form.profession}
        onChange={update('profession')}
      />

      <TextField
        id="telephone"
        label="Téléphone"
        required
        value={form.telephone}
        onChange={update('telephone')}
        error={fieldErrors.telephone}
        placeholder="+224620000000"
      />

      <TextField
        id="residence"
        label="Résidence"
        value={form.residence}
        onChange={update('residence')}
      />

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Ajouter
        </Button>
      </div>
    </form>
  )
}
