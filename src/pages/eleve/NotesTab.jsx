import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileEdit } from 'lucide-react'
import { creerReclamation, getNotes } from '../../api/portailEleve'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { formatDate } from '../../lib/formatDate'

const RECLAMATION_STATUT_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_REVISION: 'En révision',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
}
function reclamationStatutBadgeVariant(statut) {
  if (statut === 'ACCEPTEE') return 'success'
  if (statut === 'REFUSEE') return 'danger'
  return 'warning'
}

/** `CreerReclamationNoteDto` : motif*, detail?. */
function ReclamationForm({ onSubmit, onCancel, isSubmitting }) {
  const [motif, setMotif] = useState('')
  const [detail, setDetail] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ motif }, { motif: [rules.required('Le motif est requis.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSubmit({ motif, ...(detail ? { detail } : {}) })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField id="motif" label="Motif" required value={motif} onChange={(e) => setMotif(e.target.value)} error={fieldErrors.motif} placeholder="Erreur de calcul sur la copie" />
      <div>
        <label htmlFor="detail" className="block text-sm font-medium text-ink-700 mb-1.5">
          Détail (optionnel)
        </label>
        <textarea
          id="detail"
          rows={3}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Le total des points semble être 15 et non 13..."
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
        />
      </div>
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Envoyer la contestation
        </Button>
      </div>
    </form>
  )
}

/**
 * Notes + contestation — c'est désormais l'ÉLÈVE qui conteste une note
 * (refonte backend, le Parent contestait auparavant). Chaque note
 * embarque directement sa disponibilité de réclamation
 * (`PortailEleveReclamationDisponibiliteDto`) : statutPeriode/peutReclamer/
 * demande — pas besoin d'appel séparé pour savoir si on peut contester.
 */
export function NotesTab() {
  const [contestingNote, setContestingNote] = useState(null)
  const queryClient = useQueryClient()

  const queryKey = ['portail-eleve', 'notes']
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: getNotes,
  })
  const notes = (Array.isArray(data) ? data : [])
    .slice()
    .sort((a, b) => (b.examen?.date ?? '').localeCompare(a.examen?.date ?? ''))

  const contesterMutation = useMutation({
    mutationFn: (payload) => creerReclamation(contestingNote.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setContestingNote(null)
    },
  })

  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
      {isLoading && (
        <div className="p-12 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}
      {isError && <ApiErrorMessage error={error} fallback="Impossible de charger tes notes." />}
      {!isLoading && !isError && notes.length === 0 && (
        <div className="p-16 text-center text-ink-400">
          <FileEdit className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucune note publiée pour l'instant.
        </div>
      )}
      {!isLoading && !isError && notes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50/80">
              <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                <th className="px-4 py-3 font-medium">Examen</th>
                <th className="px-4 py-3 font-medium">Matière</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium">Réclamation</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => {
                const demande = n.reclamation?.demande
                return (
                  <tr key={n.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink-900">{n.examen?.intitule}</td>
                    <td className="px-4 py-3 text-ink-600">{n.examen?.matiere?.intitule}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(n.examen?.date)}</td>
                    <td className="px-4 py-3 font-semibold text-ink-900">
                      {n.valeur}/{n.bareme === 'SUR_10' ? '10' : '20'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {demande ? (
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={reclamationStatutBadgeVariant(demande.statut)}>
                            {RECLAMATION_STATUT_LABELS[demande.statut] ?? demande.statut}
                          </Badge>
                          {demande.reponseProf && (
                            <p className="text-xs text-ink-400 max-w-[200px] truncate" title={demande.reponseProf}>
                              {demande.reponseProf}
                            </p>
                          )}
                        </div>
                      ) : n.reclamation?.peutReclamer ? (
                        <Button size="sm" variant="secondary" onClick={() => setContestingNote(n)}>
                          Contester
                        </Button>
                      ) : (
                        <span className="text-xs text-ink-300">
                          {n.reclamation?.statutPeriode === 'FERMEE' ? 'Période fermée' : 'Indisponible'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(contestingNote)} onClose={() => setContestingNote(null)} title="Contester cette note" maxWidth="max-w-sm">
        {contestingNote && (
          <ReclamationForm
            isSubmitting={contesterMutation.isPending}
            onCancel={() => setContestingNote(null)}
            onSubmit={(payload) => contesterMutation.mutateAsync(payload)}
          />
        )}
      </Modal>
    </div>
  )
}
