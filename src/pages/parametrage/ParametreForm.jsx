import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { CATEGORIE_PARAMETRE_OPTIONS } from '../../config/parametrageLabels'

/**
 * `SetParametreDto` : categorie (enum), cle*, valeur (JSON libre), description?.
 * `valeur` accepte n'importe quel JSON (nombre, booléen, objet...) — on
 * tente `JSON.parse` sur la saisie, et on retombe sur la chaîne brute si ce
 * n'est pas du JSON valide (ex: un simple texte comme "#1a73e8").
 */
export function ParametreForm({ onSubmit, onCancel, isSubmitting }) {
  const [categorie, setCategorie] = useState(CATEGORIE_PARAMETRE_OPTIONS[0].value)
  const [cle, setCle] = useState('')
  const [valeur, setValeur] = useState('')
  const [description, setDescription] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ cle, valeur }, { cle: [rules.required('La clé est requise.')], valeur: [rules.required('La valeur est requise.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    let parsedValeur = valeur
    try {
      parsedValeur = JSON.parse(valeur)
    } catch {
      // Pas du JSON valide (ex: "#1a73e8") — envoyé tel quel comme chaîne.
    }

    try {
      await onSubmit({ categorie, cle, valeur: parsedValeur, ...(description ? { description } : {}) })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Select id="categorie" label="Catégorie" options={CATEGORIE_PARAMETRE_OPTIONS} value={categorie} onChange={(e) => setCategorie(e.target.value)} required />
      <TextField id="cle" label="Clé" required value={cle} onChange={(e) => setCle(e.target.value)} error={fieldErrors.cle} placeholder="theme.couleurPrimaire" />
      <TextField
        id="valeur"
        label="Valeur"
        required
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        error={fieldErrors.valeur}
        placeholder='#1a73e8, true, 42, "texte", {"a":1}...'
      />
      <p className="text-xs text-ink-400 -mt-2">JSON accepté (nombre, booléen, texte entre guillemets, objet) — sinon envoyé comme texte brut.</p>
      <TextField id="description" label="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} />

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
