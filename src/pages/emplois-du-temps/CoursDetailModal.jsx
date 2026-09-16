import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2, Pencil, XCircle } from 'lucide-react'
import { annulerCours, getCours, terminerCours, updateCours } from '../../api/emploisDuTemps'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { InfoRow } from '../../components/ui/InfoRow'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  COURS_STATUT_LABELS,
  JOUR_SEMAINE_LABELS,
  TYPE_ACTIVITE_LABELS,
  coursStatutBadgeVariant,
} from '../../config/emploiDuTempsLabels'
import { formatDate } from '../../lib/formatDate'
import { CoursForm } from './CoursForm'

/** Détail d'un cours planifié : infos + modifier/terminer/annuler. */
export function CoursDetailModal({ etablissementId, classeId, coursId, onClose }) {
  const [isEditOpen, setEditOpen] = useState(false)
  const [isTerminerConfirmOpen, setTerminerConfirmOpen] = useState(false)
  const [isAnnulerConfirmOpen, setAnnulerConfirmOpen] = useState(false)
  const queryClient = useQueryClient()

  const queryKey = ['emplois-du-temps', 'cours', 'detail', etablissementId, coursId]
  const { data: cours, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getCours(etablissementId, coursId),
    enabled: Boolean(etablissementId && coursId),
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['emplois-du-temps', 'cours', etablissementId] })
  }

  const updateMutation = useMutation({
    mutationFn: (payload) => updateCours(etablissementId, coursId, payload),
    onSuccess: () => {
      invalidateAll()
      setEditOpen(false)
    },
  })

  const terminerMutation = useMutation({
    mutationFn: () => terminerCours(etablissementId, coursId),
    onSuccess: () => {
      invalidateAll()
      setTerminerConfirmOpen(false)
    },
  })

  const annulerMutation = useMutation({
    mutationFn: () => annulerCours(etablissementId, coursId),
    onSuccess: () => {
      invalidateAll()
      setAnnulerConfirmOpen(false)
      onClose()
    },
  })

  // Confirmé par un vrai payload : le champ s'appelle `etat`, pas `statut`
  // (qui n'existe pas sur cette ressource — le lire faisait passer
  // `isPlanifie` toujours à `true`, affichant Terminer/Annuler/Modifier
  // même sur un cours déjà annulé).
  const isPlanifie = !cours?.etat || cours.etat === 'PLANIFIE'

  return (
    <>
      <Modal open={Boolean(coursId)} onClose={onClose} title="Détail du cours">
        {isLoading && (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && (
          <ApiErrorMessage error={error} fallback="Impossible de charger ce cours." className="text-sm text-danger-600 text-center py-8" />
        )}
        {cours && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <CalendarClock className="h-5 w-5 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-ink-900 truncate">
                  {cours.matiere?.intitule ?? 'Matière'}
                </p>
                <p className="text-xs text-ink-400">
                  {JOUR_SEMAINE_LABELS[cours.jourSemaine] ?? cours.jourSemaine} · {cours.heureDebut}–{cours.heureFin}
                </p>
              </div>
              {cours.etat && (
                <Badge variant={coursStatutBadgeVariant(cours.etat)} className="shrink-0">
                  {COURS_STATUT_LABELS[cours.etat] ?? cours.etat}
                </Badge>
              )}
            </div>

            <div>
              <InfoRow icon={CalendarClock} label="Enseignant" value={`${cours.employe?.prenom ?? ''} ${cours.employe?.nom ?? ''}`.trim()} />
              <InfoRow icon={CalendarClock} label="Salle" value={cours.salle?.numero} />
              <InfoRow icon={CalendarClock} label="Type d'activité" value={TYPE_ACTIVITE_LABELS[cours.typeActivite] ?? cours.typeActivite} />
              <InfoRow icon={CalendarClock} label="Séance ponctuelle" value={cours.date ? formatDate(cours.date) : null} />
              <InfoRow icon={CalendarClock} label="Chapitre" value={cours.chapitre} />
            </div>

            {isPlanifie && (
              <div className="flex flex-wrap justify-end gap-2 pt-5 mt-4 border-t border-ink-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="!text-danger-600"
                  onClick={() => setAnnulerConfirmOpen(true)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Annuler
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setTerminerConfirmOpen(true)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Terminer
                </Button>
                <Button size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={isEditOpen} onClose={() => setEditOpen(false)} title="Modifier le cours">
        {cours && (
          <CoursForm
            etablissementId={etablissementId}
            classeId={classeId}
            initialValues={cours}
            isSubmitting={updateMutation.isPending}
            onCancel={() => setEditOpen(false)}
            onSubmit={(payload) => updateMutation.mutateAsync(payload)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={isTerminerConfirmOpen}
        onClose={() => setTerminerConfirmOpen(false)}
        onConfirm={() => terminerMutation.mutate()}
        isLoading={terminerMutation.isPending}
        variant="primary"
        title="Terminer ce cours ?"
        description="Le cours planifié passe au statut Terminé."
        confirmLabel="Terminer"
      />

      <ConfirmDialog
        open={isAnnulerConfirmOpen}
        onClose={() => setAnnulerConfirmOpen(false)}
        onConfirm={() => annulerMutation.mutate()}
        isLoading={annulerMutation.isPending}
        title="Annuler ce cours ?"
        description="Le cours passe au statut Annulé (suppression réversible côté backend)."
        confirmLabel="Annuler le cours"
      />
    </>
  )
}
