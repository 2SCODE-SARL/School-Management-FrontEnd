import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarRange, Plus } from 'lucide-react'
import {
  createAnneeScolaire,
  listAnneesScolaires,
  updateAnneeScolaire,
} from '../../api/etablissements'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { DynamicForm } from '../../components/crud/DynamicForm'
import { ANNEE_STATUT_LABELS, anneeStatutBadgeVariant } from '../../config/academiqueLabels'
import { formatDate } from '../../lib/formatDate'
import { rules } from '../../lib/validate'
import { AnneeDetailModal } from './AnneeDetailModal'

const FORM_FIELDS = [
  { name: 'libelle', label: 'Libellé', type: 'text', placeholder: '2025–2026', required: true },
  { name: 'dateDebut', label: 'Date de début', type: 'date', required: true },
  { name: 'dateFin', label: 'Date de fin', type: 'date', required: true },
]
const FORM_RULES = {
  libelle: [rules.required('Le libellé est requis.')],
  dateDebut: [rules.required('La date de début est requise.')],
  dateFin: [rules.required('La date de fin est requise.')],
}

/**
 * Années scolaires : fondation du reste de l'académique (classes,
 * pondérations, résultats en dépendent toutes via `anneeScolaireId` /
 * `trimestreId`). Ouvrir/fermer une année et ses trimestres se fait depuis
 * le détail (AnneeDetailModal).
 */
export function AnneesTab({ etablissementId }) {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editingAnnee, setEditingAnnee] = useState(null)
  const [viewingAnneeId, setViewingAnneeId] = useState(null)
  const queryClient = useQueryClient()

  const queryKey = ['academique', 'annees', etablissementId]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listAnneesScolaires(etablissementId),
  })
  const annees = (Array.isArray(data) ? data : (data?.items ?? [])).slice().sort((a, b) =>
    (b.dateDebut ?? '').localeCompare(a.dateDebut ?? ''),
  )

  const createMutation = useMutation({
    mutationFn: (payload) => createAnneeScolaire(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAnneeScolaire(etablissementId, id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({
        queryKey: ['academique', 'annees', 'detail', etablissementId, variables.id],
      })
      setEditingAnnee(null)
    },
  })

  function handleEdit(annee) {
    setViewingAnneeId(null)
    setEditingAnnee(annee)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Créer une année scolaire
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les années scolaires." />}
        {!isLoading && !isError && annees.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <CalendarRange className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucune année scolaire créée pour le moment.
          </div>
        )}
        {!isLoading && !isError && annees.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Année</th>
                  <th className="px-4 py-3 font-medium">Début</th>
                  <th className="px-4 py-3 font-medium">Fin</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {annees.map((annee) => (
                  <tr
                    key={annee.id}
                    onClick={() => setViewingAnneeId(annee.id)}
                    className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-ink-900">{annee.libelle}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(annee.dateDebut)}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(annee.dateFin)}</td>
                    <td className="px-4 py-3">
                      {annee.statut ? (
                        <Badge variant={anneeStatutBadgeVariant(annee.statut)}>
                          {ANNEE_STATUT_LABELS[annee.statut] ?? annee.statut}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">—</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Créer une année scolaire">
        <DynamicForm
          fields={FORM_FIELDS}
          rules={FORM_RULES}
          submitLabel="Créer"
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(values) => createMutation.mutateAsync(values)}
        />
      </Modal>

      <Modal
        open={Boolean(editingAnnee)}
        onClose={() => setEditingAnnee(null)}
        title="Modifier l'année scolaire"
      >
        {editingAnnee && (
          <DynamicForm
            fields={FORM_FIELDS}
            initialValues={{
              ...editingAnnee,
              dateDebut: editingAnnee.dateDebut?.slice(0, 10),
              dateFin: editingAnnee.dateFin?.slice(0, 10),
            }}
            submitLabel="Enregistrer"
            isSubmitting={updateMutation.isPending}
            onCancel={() => setEditingAnnee(null)}
            onSubmit={(values) => updateMutation.mutateAsync({ id: editingAnnee.id, payload: values })}
          />
        )}
      </Modal>

      <AnneeDetailModal
        etablissementId={etablissementId}
        anneeId={viewingAnneeId}
        onClose={() => setViewingAnneeId(null)}
        onEdit={handleEdit}
      />
    </div>
  )
}
