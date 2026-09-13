import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ClipboardList, Plus } from 'lucide-react'
import { createExamen, listExamens } from '../../api/resultats'
import { listClasses } from '../../api/academique'
import { getAnneeScolaire, listAnneesScolaires } from '../../api/etablissements'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { EXAMEN_STATUT_LABELS, examenStatutBadgeVariant } from '../../config/resultatsLabels'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'
import { formatDate } from '../../lib/formatDate'
import { ExamenForm } from './ExamenForm'
import { ExamenDetailModal } from './ExamenDetailModal'

export function ExamensTab({ etablissementId }) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [trimestreId, setTrimestreId] = useState('')
  const [classeId, setClasseId] = useState('')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [viewingExamenId, setViewingExamenId] = useState(null)
  const queryClient = useQueryClient()

  const { data: anneesData, isLoading: isLoadingAnnees } = useQuery({
    queryKey: ['academique', 'annees', etablissementId],
    queryFn: () => listAnneesScolaires(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const annees = Array.isArray(anneesData) ? anneesData : (anneesData?.items ?? [])
  const anneeOptions = annees.map((a) => ({ value: a.id, label: a.libelle }))

  // Un id d'année (ou de classe/trimestre, plus bas) d'un AUTRE établissement
  // ne doit jamais survivre à un changement d'établissement.
  useEffect(() => {
    setAnneeScolaireId('')
  }, [etablissementId])

  useEffect(() => {
    if (anneeScolaireId || annees.length === 0) return
    const enCours = annees.find((a) => a.statut === 'EN_COURS')
    const fallback = annees.slice().sort((a, b) => (b.dateDebut ?? '').localeCompare(a.dateDebut ?? ''))[0]
    setAnneeScolaireId((enCours ?? fallback)?.id ?? '')
  }, [annees, anneeScolaireId])

  // Les trimestres sont imbriqués dans le détail de l'année (pas de liste
  // séparée dans la doc).
  const { data: anneeDetail } = useQuery({
    queryKey: ['academique', 'annee-detail', etablissementId, anneeScolaireId],
    queryFn: () => getAnneeScolaire(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })
  const trimestres = anneeDetail?.trimestres ?? []
  const trimestreOptions = trimestres.map((t, i) => ({
    value: t.id,
    label: t.libelle ?? `Trimestre ${i + 1}`,
  }))

  useEffect(() => {
    setTrimestreId('')
  }, [anneeScolaireId])

  useEffect(() => {
    if (trimestreId || trimestres.length === 0) return
    setTrimestreId(trimestres[0].id)
  }, [trimestres, trimestreId])

  const { data: classesData } = useQuery({
    queryKey: ['academique', 'classes', etablissementId, anneeScolaireId],
    queryFn: () => listClasses(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })
  const classes = Array.isArray(classesData) ? classesData : (classesData?.items ?? [])
  const classeOptions = classes.map((c) => ({
    value: c.id,
    label: `${c.nom} (${NIVEAU_LABELS[c.niveau?.libelle] ?? c.niveau?.libelle ?? ''})`,
  }))

  useEffect(() => {
    setClasseId('')
  }, [anneeScolaireId])

  useEffect(() => {
    if (classeId || classes.length === 0) return
    setClasseId(classes[0].id)
  }, [classes, classeId])

  const examensQueryKey = ['resultats', 'examens', etablissementId, trimestreId, classeId]
  const { data: examensData, isLoading, isError } = useQuery({
    queryKey: examensQueryKey,
    queryFn: () => listExamens(etablissementId, { trimestreId, classeId }),
    enabled: Boolean(etablissementId && trimestreId && classeId),
  })
  const examens = Array.isArray(examensData) ? examensData : (examensData?.items ?? [])

  const createMutation = useMutation({
    mutationFn: (payload) => createExamen(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examensQueryKey })
      setCreateOpen(false)
    },
  })

  if (!isLoadingAnnees && annees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-warning-500/40 p-10 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-warning-500" />
        <p className="font-heading font-semibold text-ink-900 mb-1">Aucune année scolaire</p>
        <p className="text-sm text-ink-500 max-w-md mx-auto">Crée d'abord une année scolaire dans l'onglet Académique.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="max-w-xs w-full">
            <Select
              id="annee-filter"
              label="Année scolaire"
              options={anneeOptions}
              value={anneeScolaireId}
              onChange={(e) => setAnneeScolaireId(e.target.value)}
            />
          </div>
          <div className="max-w-xs w-full">
            <Select
              id="trimestre-filter"
              label="Trimestre"
              options={trimestreOptions.length ? trimestreOptions : [{ value: '', label: 'Aucun trimestre' }]}
              value={trimestreId}
              onChange={(e) => setTrimestreId(e.target.value)}
            />
          </div>
          <div className="max-w-xs w-full">
            <Select
              id="classe-filter"
              label="Classe"
              options={classeOptions.length ? classeOptions : [{ value: '', label: 'Aucune classe pour cette année' }]}
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
            />
          </div>
        </div>
        {trimestreId && classeId && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvel examen
          </Button>
        )}
      </div>

      {!trimestreId || !classeId ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
          Choisis une année, un trimestre et une classe pour voir les examens.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
          {isLoading && (
            <div className="p-12 flex justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
            </div>
          )}
          {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les examens.</p>}
          {!isLoading && !isError && examens.length === 0 && (
            <div className="p-16 text-center text-ink-400">
              <ClipboardList className="h-8 w-8 mx-auto mb-3 opacity-50" />
              Aucun examen pour cette classe et ce trimestre.
            </div>
          )}
          {!isLoading && !isError && examens.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                    <th className="px-4 py-3 font-medium">Intitulé</th>
                    <th className="px-4 py-3 font-medium">Matière</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {examens.map((ex) => (
                    <tr
                      key={ex.id}
                      onClick={() => setViewingExamenId(ex.id)}
                      className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-ink-900">{ex.intitule}</td>
                      <td className="px-4 py-3 text-ink-600">{ex.matiere?.intitule ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-600">{ex.date ? formatDate(ex.date) : '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={examenStatutBadgeVariant(ex.statut)}>
                          {EXAMEN_STATUT_LABELS[ex.statut] ?? ex.statut ?? 'Programmé'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Nouvel examen" maxWidth="max-w-lg">
        <ExamenForm
          etablissementId={etablissementId}
          classeId={classeId}
          trimestreId={trimestreId}
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>

      <ExamenDetailModal
        etablissementId={etablissementId}
        examenId={viewingExamenId}
        onClose={() => setViewingExamenId(null)}
      />
    </div>
  )
}
