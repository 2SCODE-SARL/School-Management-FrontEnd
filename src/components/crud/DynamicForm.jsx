import { useState } from 'react'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { Select } from '../ui/Select'
import { Alert } from '../ui/Alert'
import { ApiError } from '../../api/client'
import { validate } from '../../lib/validate'

/**
 * Formulaire générique piloté par une liste de champs déclaratifs — pour les
 * ressources simples (niveaux, séries, matières, salles...) où écrire un
 * composant de formulaire dédié à chaque fois serait redondant.
 *
 * `fields`: [{ name, label, type: 'text' | 'number' | 'select' | 'checkbox', options, placeholder, required }]
 * `rules`: schéma de validation (voir lib/validate)
 */
export function DynamicForm({
  fields,
  initialValues = {},
  rules = {},
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
}) {
  const [values, setValues] = useState(() => {
    const base = {}
    fields.forEach((f) => {
      if (f.name in initialValues) {
        base[f.name] = initialValues[f.name]
      } else if (f.type === 'checkbox') {
        base[f.name] = false
      } else if (f.type === 'select') {
        // Un <select> affiche visuellement sa première option même sans
        // valeur choisie : on aligne l'état initial dessus, sinon la
        // valeur réellement envoyée reste vide tant qu'on n'a pas cliqué.
        base[f.name] = f.options?.[0]?.value ?? ''
      } else {
        base[f.name] = ''
      }
    })
    return base
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  function update(name, type) {
    return (e) => {
      const value = type === 'checkbox' ? e.target.checked : e.target.value
      setValues((v) => ({ ...v, [name]: value }))
      setFieldErrors((errs) => ({ ...errs, [name]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(values, rules)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    // Les <input type="number"> renvoient toujours une chaîne de caractères
    // en React — on convertit ici pour envoyer un vrai nombre à l'API.
    const payload = { ...values }
    fields.forEach((f) => {
      if (f.type === 'number' && payload[f.name] !== '') {
        payload[f.name] = Number(payload[f.name])
      }
    })

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {fields.map((f) => {
        if (f.type === 'checkbox') {
          return (
            <label key={f.name} className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={values[f.name]}
                onChange={update(f.name, 'checkbox')}
                className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
              />
              {f.label}
            </label>
          )
        }
        if (f.type === 'select') {
          return (
            <Select
              key={f.name}
              id={f.name}
              label={f.label}
              options={f.options}
              value={values[f.name]}
              onChange={update(f.name)}
              error={fieldErrors[f.name]}
              required={f.required}
            />
          )
        }
        return (
          <TextField
            key={f.name}
            id={f.name}
            label={f.label}
            type={f.type ?? 'text'}
            value={values[f.name]}
            onChange={update(f.name)}
            error={fieldErrors[f.name]}
            placeholder={f.placeholder}
            required={f.required}
          />
        )
      })}

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
