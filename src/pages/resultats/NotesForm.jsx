import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { listElevesClasse } from '../../api/eleves'

/**
 * Saisie de notes pour toute la classe en une fois (`SaisirNotesDto`).
 * Utilise le vrai roster de la classe (`GET .../classes/{id}/eleves`,
 * ajouté par le backend suite à notre remontée — avant, on devait chercher
 * chaque élève par nom au hasard).
 */
export function NotesForm({ etablissementId, classeId, onCancel, onSubmit, isSubmitting }) {
  const [valeurs, setValeurs] = useState({})
  const [commentaires, setCommentaires] = useState({})
  const [formError, setFormError] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['eleves', 'classe-roster', etablissementId, classeId],
    queryFn: () => listElevesClasse(etablissementId, classeId, { limit: 100 }),
    enabled: Boolean(etablissementId && classeId),
  })
  const eleves = (data?.items ?? [])
    .slice()
    .sort((a, b) => `${a.nom ?? ''}`.localeCompare(`${b.nom ?? ''}`))

  // Repart de zéro si on change d'examen/classe entre deux ouvertures.
  useEffect(() => {
    setValeurs({})
    setCommentaires({})
  }, [classeId])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const notes = eleves
      .filter((el) => valeurs[el.id] !== undefined && valeurs[el.id] !== '')
      .map((el) => ({
        eleveId: el.id,
        valeur: Number(valeurs[el.id]),
        ...(commentaires[el.id] ? { commentaire: commentaires[el.id] } : {}),
      }))

    if (notes.length === 0) {
      setFormError('Saisis au moins une note.')
      return
    }

    try {
      await onSubmit(notes)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-danger-600 text-center py-6">Impossible de charger les élèves de la classe.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {eleves.length === 0 ? (
        <p className="text-sm text-ink-400 text-center py-6">Aucun élève affecté à cette classe.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {eleves.map((el) => (
            <div key={el.id} className="flex items-center gap-2">
              <p className="flex-1 text-sm text-ink-900 truncate min-w-0">
                {el.prenom} {el.nom} <span className="text-ink-400">({el.matricule})</span>
              </p>
              <TextField
                type="number"
                step="0.5"
                value={valeurs[el.id] ?? ''}
                onChange={(e) => setValeurs((v) => ({ ...v, [el.id]: e.target.value }))}
                placeholder="Note /20"
                className="w-28 shrink-0"
              />
              <TextField
                value={commentaires[el.id] ?? ''}
                onChange={(e) => setCommentaires((c) => ({ ...c, [el.id]: e.target.value }))}
                placeholder="Commentaire (optionnel)"
                className="w-52 shrink-0"
              />
            </div>
          ))}
        </div>
      )}

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Enregistrer les notes
        </Button>
      </div>
    </form>
  )
}
