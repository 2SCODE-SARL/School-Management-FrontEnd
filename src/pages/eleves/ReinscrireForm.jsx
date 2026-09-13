import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Combobox } from '../../components/ui/Combobox'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { searchEleves } from '../../api/eleves'
import { listClasses } from '../../api/academique'
import { rules, validate } from '../../lib/validate'

/**
 * Réinscription d'un élève déjà connu pour une nouvelle année scolaire,
 * avec affectation directe à une classe. `statutHistorique` a disparu du
 * DTO backend (probablement redondant avec le nouveau statut de dossier
 * d'inscription BROUILLON/SOUMISE/.../VALIDEE).
 */
export function ReinscrireForm({ etablissementId, anneeScolaireId, onSubmit, onCancel, isSubmitting }) {
  const [eleveId, setEleveId] = useState('')
  const [classeId, setClasseId] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  const { data: elevesData } = useQuery({
    queryKey: ['eleves', 'options', etablissementId],
    queryFn: () => searchEleves(etablissementId, { limit: 100 }),
    enabled: Boolean(etablissementId),
  })
  const eleveOptions = (elevesData?.items ?? []).map((e) => ({
    value: e.id,
    label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() + (e.matricule ? ` (${e.matricule})` : ''),
  }))

  const { data: classesData } = useQuery({
    queryKey: ['academique', 'classes', etablissementId, anneeScolaireId],
    queryFn: () => listClasses(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })
  const classes = Array.isArray(classesData) ? classesData : (classesData?.items ?? [])
  const classeOptions = classes.map((c) => ({ value: c.id, label: c.nom }))

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(
      { eleveId, classeId },
      {
        eleveId: [rules.required("Choisis l'élève à réinscrire.")],
        classeId: [rules.required('La classe est requise.')],
      },
    )
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ eleveId, anneeScolaireId, classeId })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Combobox
        id="eleveId"
        label="Élève"
        options={eleveOptions}
        value={eleveId}
        onChange={setEleveId}
        placeholder="Sélectionner un élève..."
        searchPlaceholder="Rechercher par nom..."
        error={fieldErrors.eleveId}
        required
      />
      <Select
        id="classeId"
        label="Classe d'affectation"
        options={[{ value: '', label: classeOptions.length ? 'Choisir une classe...' : 'Aucune classe pour cette année' }, ...classeOptions]}
        value={classeId}
        onChange={(e) => setClasseId(e.target.value)}
        error={fieldErrors.classeId}
        required
      />

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Réinscrire
        </Button>
      </div>
    </form>
  )
}
