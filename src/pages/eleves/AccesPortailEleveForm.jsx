import { useState } from 'react'
import { Dices, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { generatePassword } from '../../lib/generatePassword'
import { rules, validate } from '../../lib/validate'

/**
 * Provisionne le compte de connexion du portail élève — email + mot de
 * passe seulement (contrairement au compte employé, pas de rôle à choisir
 * ni de validation Directeur requise après coup).
 */
export function AccesPortailEleveForm({ onCancel, onSubmit, isSubmitting }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  function handleGeneratePassword() {
    setPassword(generatePassword())
    setShowPassword(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate(
      { email, password },
      {
        email: [rules.required("L'email est requis."), rules.email()],
        password: [rules.required('Le mot de passe est requis.'), rules.minLength(8)],
      },
    )
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ email, password })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        id="acces-email"
        label="Adresse e-mail"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        placeholder="eleve@ecole.gn"
      />
      <div>
        <TextField
          id="acces-password"
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          placeholder="8 caractères minimum"
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-ink-400 hover:text-ink-600 transition-colors"
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          }
        />
        <button
          type="button"
          onClick={handleGeneratePassword}
          className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium mt-1.5"
        >
          <Dices className="h-3.5 w-3.5" />
          Générer un mot de passe sécurisé
        </button>
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Créer l'accès
        </Button>
      </div>
    </form>
  )
}
