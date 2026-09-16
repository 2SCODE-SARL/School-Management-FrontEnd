import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Lock, LockOpen, Pencil } from 'lucide-react'
import {
  fermerAnneeScolaire,
  getAnneeScolaire,
  ouvrirAnneeScolaire,
  setTrimestreStatut,
  updateTrimestre,
} from '../../api/etablissements'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TextField } from '../../components/ui/TextField'
import {
  ANNEE_STATUT_LABELS,
  TRIMESTRE_STATUT_LABELS,
  anneeStatutBadgeVariant,
  trimestreStatutBadgeVariant,
} from '../../config/academiqueLabels'
import { formatDate } from '../../lib/formatDate'
import { pickArray } from '../../lib/pick'

const CONFIRM_TEXT = {
  'ouvrir-annee': {
    title: 'Ouvrir cette année scolaire ?',
    description: "L'année passe en cours (EN_COURS).",
    variant: 'primary',
  },
  'fermer-annee': {
    title: 'Fermer cette année scolaire ?',
    description: 'Ferme aussi tous les trimestres encore ouverts. Difficile à annuler.',
    variant: 'danger',
  },
  'ouvrir-trimestre': {
    title: 'Ouvrir ce trimestre ?',
    description: 'Les notes pourront de nouveau y être saisies.',
    variant: 'primary',
  },
  'cloturer-trimestre': {
    title: 'Clôturer ce trimestre ?',
    description: 'Les notes de ce trimestre ne pourront plus être modifiées.',
    variant: 'danger',
  },
}

/** Formulaire minimal (dates) pour ajuster un trimestre déjà créé. */
function TrimestreDatesForm({ trimestre, onCancel, onSubmit, isSubmitting }) {
  const [dateDebut, setDateDebut] = useState(trimestre.dateDebut?.slice(0, 10) ?? '')
  const [dateFin, setDateFin] = useState(trimestre.dateFin?.slice(0, 10) ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {}
    if (dateDebut) payload.dateDebut = dateDebut
    if (dateFin) payload.dateFin = dateFin
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <TextField
          id="trim-debut"
          label="Début"
          type="date"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
        />
        <TextField
          id="trim-fin"
          label="Fin"
          type="date"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
        />
      </div>
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

/** Détail d'une année scolaire : dates, statut, trimestres + actions ouvrir/fermer. */
export function AnneeDetailModal({ etablissementId, anneeId, onClose, onEdit }) {
  const [editingTrimestre, setEditingTrimestre] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const queryClient = useQueryClient()

  const queryKey = ['academique', 'annees', 'detail', etablissementId, anneeId]
  const { data: annee, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getAnneeScolaire(etablissementId, anneeId),
    enabled: Boolean(etablissementId && anneeId),
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['academique', 'annees', etablissementId] })
  }

  const ouvrirAnneeMutation = useMutation({
    mutationFn: () => ouvrirAnneeScolaire(etablissementId, anneeId),
    onSuccess: () => {
      invalidateAll()
      setConfirmAction(null)
    },
  })
  const fermerAnneeMutation = useMutation({
    mutationFn: () => fermerAnneeScolaire(etablissementId, anneeId),
    onSuccess: () => {
      invalidateAll()
      setConfirmAction(null)
    },
  })
  const trimestreStatutMutation = useMutation({
    mutationFn: ({ trimestreId, statut }) =>
      setTrimestreStatut(etablissementId, anneeId, trimestreId, statut),
    onSuccess: () => {
      invalidateAll()
      setConfirmAction(null)
    },
  })
  const updateTrimestreMutation = useMutation({
    mutationFn: ({ trimestreId, payload }) =>
      updateTrimestre(etablissementId, anneeId, trimestreId, payload),
    onSuccess: () => {
      invalidateAll()
      setEditingTrimestre(null)
    },
  })

  const trimestres = pickArray(annee, ['trimestres'])
    .slice()
    .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))

  const isActionLoading =
    ouvrirAnneeMutation.isPending || fermerAnneeMutation.isPending || trimestreStatutMutation.isPending

  function runConfirmedAction() {
    if (!confirmAction) return
    if (confirmAction.type === 'ouvrir-annee') ouvrirAnneeMutation.mutate()
    else if (confirmAction.type === 'fermer-annee') fermerAnneeMutation.mutate()
    else if (confirmAction.type === 'ouvrir-trimestre')
      trimestreStatutMutation.mutate({ trimestreId: confirmAction.trimestre.id, statut: 'OUVERT' })
    else if (confirmAction.type === 'cloturer-trimestre')
      trimestreStatutMutation.mutate({ trimestreId: confirmAction.trimestre.id, statut: 'CLOTURE' })
  }

  const confirmText = confirmAction ? CONFIRM_TEXT[confirmAction.type] : null

  return (
    <>
      <Modal open={Boolean(anneeId)} onClose={onClose} title="Détail de l'année scolaire">
        {isLoading && (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && (
          <ApiErrorMessage
            error={error}
            fallback="Impossible de charger cette année scolaire."
            className="text-sm text-danger-600 text-center py-8"
          />
        )}
        {annee && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-ink-900 truncate">{annee.libelle}</p>
                <p className="text-xs text-ink-400">
                  {formatDate(annee.dateDebut)} — {formatDate(annee.dateFin)}
                </p>
              </div>
              {annee.statut && (
                <Badge variant={anneeStatutBadgeVariant(annee.statut)} className="shrink-0">
                  {ANNEE_STATUT_LABELS[annee.statut] ?? annee.statut}
                </Badge>
              )}
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium text-ink-900 mb-3">Trimestres</p>
              {trimestres.length === 0 ? (
                <p className="text-sm text-ink-400">Aucun trimestre trouvé pour cette année.</p>
              ) : (
                <div className="space-y-2">
                  {trimestres.map((t, index) => (
                    <div
                      key={t.id ?? index}
                      className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900">
                          Trimestre {t.numero ?? index + 1}
                        </p>
                        <p className="text-xs text-ink-400">
                          {t.dateDebut ? formatDate(t.dateDebut) : '—'} →{' '}
                          {t.dateFin ? formatDate(t.dateFin) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={trimestreStatutBadgeVariant(t.statut)}>
                          {TRIMESTRE_STATUT_LABELS[t.statut] ?? t.statut ?? '—'}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => setEditingTrimestre(t)}
                          className="text-ink-400 hover:text-primary-600 transition-colors"
                          aria-label="Modifier les dates du trimestre"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: t.statut === 'OUVERT' ? 'cloturer-trimestre' : 'ouvrir-trimestre',
                              trimestre: t,
                            })
                          }
                          className="text-ink-400 hover:text-primary-600 transition-colors"
                          aria-label={t.statut === 'OUVERT' ? 'Clôturer le trimestre' : 'Ouvrir le trimestre'}
                        >
                          {t.statut === 'OUVERT' ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <LockOpen className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-5 mt-4 border-t border-ink-100">
              {annee.statut === 'EN_COURS' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="!text-danger-600"
                  onClick={() => setConfirmAction({ type: 'fermer-annee' })}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Fermer l'année
                </Button>
              ) : annee.statut !== 'CLOTUREE' ? (
                <Button variant="secondary" size="sm" onClick={() => setConfirmAction({ type: 'ouvrir-annee' })}>
                  <LockOpen className="h-3.5 w-3.5" />
                  Ouvrir l'année
                </Button>
              ) : null}
              <Button size="sm" onClick={() => onEdit(annee)}>
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(editingTrimestre)}
        onClose={() => setEditingTrimestre(null)}
        title="Modifier le trimestre"
        maxWidth="max-w-sm"
      >
        {editingTrimestre && (
          <TrimestreDatesForm
            trimestre={editingTrimestre}
            isSubmitting={updateTrimestreMutation.isPending}
            onCancel={() => setEditingTrimestre(null)}
            onSubmit={(payload) =>
              updateTrimestreMutation.mutate({ trimestreId: editingTrimestre.id, payload })
            }
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
        isLoading={isActionLoading}
        variant={confirmText?.variant}
        title={confirmText?.title}
        description={confirmText?.description}
        confirmLabel="Confirmer"
      />
    </>
  )
}
