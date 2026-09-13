import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'

/**
 * Rattache un parent déjà présent AILLEURS sur la plateforme (autre
 * établissement) à l'élève courant, via une demande soumise à son
 * approbation — nouveau mécanisme ajouté par le backend suite à notre
 * remontée. Un seul champ : son email exact. Contrairement à
 * `linkParentToEleve` (fratrie, même établissement), ceci ne rattache pas
 * immédiatement : le parent doit d'abord confirmer, depuis son portail,
 * que l'élève désigné est bien le sien.
 */
export function RattacherParentPlateformeForm({ onSubmit, onCancel, isSubmitting }) {
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ email }, { email: [rules.required("L'email est requis."), rules.email()] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ email })
      setSent(true)
      setEmail('')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          Demande envoyée. Le parent la verra dans son portail avec les informations de l'élève, et devra confirmer
          que c'est bien son enfant avant qu'il n'apparaisse dans la liste des parents de l'établissement.
        </Alert>
        <div className="flex justify-end pt-2">
          <Button type="button" onClick={onCancel}>
            Fermer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-ink-500">
        Ce parent a déjà un compte sur la plateforme (via un autre établissement) et l'un de ses enfants est inscrit
        ici ? Indique son email exact : il recevra une demande à approuver depuis son portail, sans avoir à ressaisir
        ses informations.
      </p>
      <TextField
        id="email"
        label="Email du parent"
        type="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setFieldErrors((errs) => ({ ...errs, email: undefined }))
        }}
        error={fieldErrors.email}
        placeholder="parent@exemple.com"
      />

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <Send className="h-3.5 w-3.5" />
          Envoyer la demande
        </Button>
      </div>
    </form>
  )
}
