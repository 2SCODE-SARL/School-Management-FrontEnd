import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRightCircle, CheckCircle2, ClipboardList, Plus, Send } from 'lucide-react'
import {
  getExamen,
  getPeriodeReclamation,
  listNotes,
  ouvrirPeriodeReclamation,
  publierExamen,
  saisirNotes,
  setExamenStatut,
  validerNote,
} from '../../api/resultats'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ApiError } from '../../api/client'
import { EXAMEN_STATUT_LABELS, examenStatutBadgeVariant, getNextExamenStatutOptions } from '../../config/resultatsLabels'
import { formatDate } from '../../lib/formatDate'
import { pick } from '../../lib/pick'
import { NotesForm } from './NotesForm'

/** Détail d'un examen : statut, saisie/validation des notes, publication. */
export function ExamenDetailModal({ etablissementId, examenId, onClose }) {
  const [nouveauStatut, setNouveauStatut] = useState('')
  const [isNotesOpen, setNotesOpen] = useState(false)
  const [isPublierConfirmOpen, setPublierConfirmOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const [periodeDateDebut, setPeriodeDateDebut] = useState('')
  const [periodeDateFin, setPeriodeDateFin] = useState('')
  const [periodeError, setPeriodeError] = useState('')
  const queryClient = useQueryClient()

  const examenQueryKey = ['resultats', 'examen', etablissementId, examenId]
  const { data: examen, isLoading, isError } = useQuery({
    queryKey: examenQueryKey,
    queryFn: () => getExamen(etablissementId, examenId),
    enabled: Boolean(etablissementId && examenId),
  })

  const notesQueryKey = ['resultats', 'notes', etablissementId, examenId]
  const { data: notesData, isLoading: isLoadingNotes } = useQuery({
    queryKey: notesQueryKey,
    queryFn: () => listNotes(etablissementId, examenId),
    enabled: Boolean(etablissementId && examenId),
  })
  const notes = Array.isArray(notesData) ? notesData : (notesData?.items ?? [])

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: examenQueryKey })
    queryClient.invalidateQueries({ queryKey: notesQueryKey })
    queryClient.invalidateQueries({ queryKey: ['resultats', 'examens'] })
  }

  const saisirMutation = useMutation({
    mutationFn: (notesPayload) => saisirNotes(etablissementId, examenId, notesPayload),
    onSuccess: () => {
      invalidateAll()
      setNotesOpen(false)
    },
  })

  const statutMutation = useMutation({
    mutationFn: () => setExamenStatut(etablissementId, examenId, nouveauStatut),
    onSuccess: () => {
      invalidateAll()
      setNouveauStatut('')
      setActionError('')
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  const publierMutation = useMutation({
    mutationFn: () => publierExamen(etablissementId, examenId),
    onSuccess: () => {
      invalidateAll()
      setPublierConfirmOpen(false)
      setActionError('')
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  const validerNoteMutation = useMutation({
    mutationFn: (noteId) => validerNote(etablissementId, noteId),
    onSuccess: invalidateAll,
  })

  // Période de réclamation — l'Enseignant doit l'ouvrir explicitement pour
  // que ses élèves puissent contester une note de cet examen (ajouté par
  // le backend suite à notre remontée -7). Réponse non typée dans la doc
  // (aucun schéma de lecture, juste `OuvrirPeriodeReclamationDto` pour
  // écrire) : champs devinés par analogie avec
  // `PortailEleveReclamationDisponibiliteDto` (statutPeriode/dateDebut/dateFin).
  const periodeQueryKey = ['resultats', 'periode-reclamation', etablissementId, examenId]
  const { data: periode } = useQuery({
    queryKey: periodeQueryKey,
    queryFn: () => getPeriodeReclamation(etablissementId, examenId),
    enabled: Boolean(etablissementId && examenId && examen?.statut === 'PUBLIE'),
  })

  const ouvrirPeriodeMutation = useMutation({
    mutationFn: () =>
      ouvrirPeriodeReclamation(etablissementId, examenId, {
        dateDebut: new Date(periodeDateDebut).toISOString(),
        dateFin: new Date(periodeDateFin).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: periodeQueryKey })
      setPeriodeError('')
    },
    onError: (err) => setPeriodeError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  function handleOuvrirPeriode() {
    setPeriodeError('')
    if (!periodeDateDebut || !periodeDateFin) {
      setPeriodeError('Indique une date de début et de fin.')
      return
    }
    ouvrirPeriodeMutation.mutate()
  }

  if (!examen) {
    return (
      <Modal open={Boolean(examenId)} onClose={onClose} title="Détail de l'examen">
        {isLoading && (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <p className="text-sm text-danger-600 text-center py-8">Impossible de charger cet examen.</p>}
      </Modal>
    )
  }

  const statut = pick(examen, ['statut'], 'PROGRAMME')
  const nextOptions = getNextExamenStatutOptions(statut)

  return (
    <>
      <Modal open={Boolean(examenId)} onClose={onClose} title="Détail de l'examen" maxWidth="max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <ClipboardList className="h-5 w-5 text-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold text-ink-900 truncate">{examen.intitule}</p>
            <p className="text-xs text-ink-400">
              {examen.matiere?.intitule ?? '—'} · {examen.date ? formatDate(examen.date) : '—'}
            </p>
          </div>
          <Badge variant={examenStatutBadgeVariant(statut)} className="shrink-0">
            {EXAMEN_STATUT_LABELS[statut] ?? statut}
          </Badge>
        </div>

        <div className="pt-4 border-t border-ink-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink-900">Notes</p>
            <Button size="sm" variant="secondary" onClick={() => setNotesOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Saisir des notes
            </Button>
          </div>

          {isLoadingNotes ? (
            <div className="p-6 flex justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-ink-400">Aucune note saisie pour l'instant.</p>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => {
                const eleveNom = `${pick(n, ['eleve'], {})?.prenom ?? ''} ${pick(n, ['eleve'], {})?.nom ?? ''}`.trim() || n.eleveId
                const estValide = pick(n, ['valide', 'estValide'], false) === true || pick(n, ['statut'], null) === 'VALIDE'
                return (
                  <div key={n.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{eleveNom}</p>
                      {n.commentaire && <p className="text-xs text-ink-400 truncate">{n.commentaire}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-ink-900">{n.valeur}/20</span>
                      {estValide ? (
                        <Badge variant="success">Validée</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          isLoading={validerNoteMutation.isPending}
                          onClick={() => validerNoteMutation.mutate(n.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Valider
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {statut === 'PUBLIE' && (
          <div className="pt-4 mt-4 border-t border-ink-100">
            <p className="text-sm font-medium text-ink-900 mb-2">Période de réclamation</p>
            {periode?.statutPeriode === 'OUVERTE' || periode?.statutPeriode === 'PLANIFIEE' ? (
              <p className="text-sm text-ink-600">
                {periode.statutPeriode === 'OUVERTE' ? 'Ouverte' : 'Planifiée'} du {formatDate(periode.dateDebut) ?? '—'} au{' '}
                {formatDate(periode.dateFin) ?? '—'}.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 items-end">
                <TextField
                  id="periode-debut"
                  label="Début"
                  type="datetime-local"
                  value={periodeDateDebut}
                  onChange={(e) => setPeriodeDateDebut(e.target.value)}
                  className="flex-1"
                />
                <TextField
                  id="periode-fin"
                  label="Fin"
                  type="datetime-local"
                  value={periodeDateFin}
                  onChange={(e) => setPeriodeDateFin(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" size="sm" variant="secondary" isLoading={ouvrirPeriodeMutation.isPending} onClick={handleOuvrirPeriode}>
                  Ouvrir la période
                </Button>
              </div>
            )}
            {periodeError && <Alert variant="danger" className="mt-2">{periodeError}</Alert>}
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-ink-100 space-y-4">
          {nextOptions.length === 0 ? (
            <p className="text-sm text-ink-400">Examen au statut final — plus aucune transition possible.</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-ink-900 mb-2">Faire avancer le statut</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  options={[{ value: '', label: 'Choisir un statut...' }, ...nextOptions]}
                  value={nouveauStatut}
                  onChange={(e) => setNouveauStatut(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!nouveauStatut}
                  isLoading={statutMutation.isPending}
                  onClick={() => statutMutation.mutate()}
                >
                  <ArrowRightCircle className="h-3.5 w-3.5" />
                  Mettre à jour
                </Button>
              </div>
            </div>
          )}

          {actionError && <Alert variant="danger">{actionError}</Alert>}

          {statut !== 'PUBLIE' && (
            <div className="flex justify-end pt-3 border-t border-ink-100">
              <Button size="sm" onClick={() => setPublierConfirmOpen(true)}>
                <Send className="h-3.5 w-3.5" />
                Publier les résultats
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={isNotesOpen} onClose={() => setNotesOpen(false)} title="Saisir des notes" maxWidth="max-w-4xl">
        <NotesForm
          etablissementId={etablissementId}
          classeId={examen.classeId}
          isSubmitting={saisirMutation.isPending}
          onCancel={() => setNotesOpen(false)}
          onSubmit={(notesPayload) => saisirMutation.mutateAsync(notesPayload)}
        />
      </Modal>

      <ConfirmDialog
        open={isPublierConfirmOpen}
        onClose={() => setPublierConfirmOpen(false)}
        onConfirm={() => publierMutation.mutate()}
        isLoading={publierMutation.isPending}
        title="Publier les résultats de cet examen ?"
        description="Les notes deviennent visibles aux élèves et parents concernés. Action non documentée comme réversible."
        confirmLabel="Publier"
      />
    </>
  )
}
