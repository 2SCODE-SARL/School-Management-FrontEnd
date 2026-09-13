import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { changeMyPassword } from '../../api/profile'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'

const EMPTY_FORM = { ancien: '', nouveau: '', confirmation: '' }

export function ChangePasswordModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  const mutation = useMutation({
    mutationFn: () => changeMyPassword(form.ancien, form.nouveau),
    onSuccess: () => {
      setForm(EMPTY_FORM)
      onSuccess()
    },
  })

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  function handleClose() {
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setFormError('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(form, {
      ancien: [rules.required('Ton mot de passe actuel est requis.')],
      nouveau: [
        rules.required('Le nouveau mot de passe est requis.'),
        rules.minLength(8),
      ],
      confirmation: [
        rules.required('Confirme le nouveau mot de passe.'),
        (value) =>
          value !== form.nouveau ? 'Les deux mots de passe ne correspondent pas.' : null,
      ],
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await mutation.mutateAsync()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Changer le mot de passe" maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          id="ancien"
          label="Mot de passe actuel"
          type={showPasswords ? 'text' : 'password'}
          required
          value={form.ancien}
          onChange={update('ancien')}
          error={fieldErrors.ancien}
        />
        <TextField
          id="nouveau"
          label="Nouveau mot de passe"
          type={showPasswords ? 'text' : 'password'}
          required
          value={form.nouveau}
          onChange={update('nouveau')}
          error={fieldErrors.nouveau}
          placeholder="8 caractères minimum"
        />
        <TextField
          id="confirmation"
          label="Confirmer le nouveau mot de passe"
          type={showPasswords ? 'text' : 'password'}
          required
          value={form.confirmation}
          onChange={update('confirmation')}
          error={fieldErrors.confirmation}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPasswords((v) => !v)}
              className="text-ink-400 hover:text-ink-600 transition-colors"
              aria-label={showPasswords ? 'Masquer' : 'Afficher'}
            >
              {showPasswords ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          }
        />

        {formError && <Alert variant="danger">{formError}</Alert>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Changer le mot de passe
          </Button>
        </div>
      </form>
    </Modal>
  )
}
