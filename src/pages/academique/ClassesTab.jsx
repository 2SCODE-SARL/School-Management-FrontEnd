import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Layers, Plus } from 'lucide-react'
import {
  createClasse,
  listClasses,
  listNiveaux,
  listSalles,
  updateClasse,
} from '../../api/academique'
import { listAnneesScolaires } from '../../api/etablissements'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'
import { ClasseForm } from './ClasseForm'
import { ClasseDetailModal } from './ClasseDetailModal'

export function ClassesTab({ etablissementId }) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editingClasse, setEditingClasse] = useState(null)
  const [viewingClasseId, setViewingClasseId] = useState(null)
  const queryClient = useQueryClient()

  const { data: anneesData, isLoading: isLoadingAnnees } = useQuery({
    queryKey: ['academique', 'annees', etablissementId],
    queryFn: () => listAnneesScolaires(etablissementId),
  })
  const annees = Array.isArray(anneesData) ? anneesData : (anneesData?.items ?? [])
  const anneeOptions = annees.map((a) => ({ value: a.id, label: a.libelle }))

  // Un id d'année d'un AUTRE établissement ne doit jamais survivre à un
  // changement d'établissement (confirmé par le backend : sinon "année
  // scolaire introuvable" pour ce tenant).
  useEffect(() => {
    setAnneeScolaireId('')
  }, [etablissementId])

  // Sélectionne par défaut l'année en cours, sinon la plus récente.
  useEffect(() => {
    if (anneeScolaireId || annees.length === 0) return
    const enCours = annees.find((a) => a.statut === 'EN_COURS')
    const fallback = annees.slice().sort((a, b) => (b.dateDebut ?? '').localeCompare(a.dateDebut ?? ''))[0]
    setAnneeScolaireId((enCours ?? fallback)?.id ?? '')
  }, [annees, anneeScolaireId])

  const { data: niveauxData } = useQuery({
    queryKey: ['academique', 'niveaux', etablissementId],
    queryFn: () => listNiveaux(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const niveaux = Array.isArray(niveauxData) ? niveauxData : (niveauxData?.items ?? [])
  const niveauOptions = niveaux.map((n) => ({ value: n.id, label: NIVEAU_LABELS[n.libelle] ?? n.libelle }))

  const { data: sallesData } = useQuery({
    queryKey: ['academique', 'salles', etablissementId],
    queryFn: () => listSalles(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const salles = Array.isArray(sallesData) ? sallesData : (sallesData?.items ?? [])
  const salleOptions = salles.map((s) => ({ value: s.id, label: s.numero }))

  const classesQueryKey = ['academique', 'classes', etablissementId, anneeScolaireId]
  const { data: classesData, isLoading, isError } = useQuery({
    queryKey: classesQueryKey,
    queryFn: () => listClasses(etablissementId, anneeScolaireId),
    enabled: Boolean(anneeScolaireId),
  })
  const classes = Array.isArray(classesData) ? classesData : (classesData?.items ?? [])

  const createMutation = useMutation({
    mutationFn: (payload) => createClasse(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classesQueryKey })
      setCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateClasse(etablissementId, id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: classesQueryKey })
      queryClient.invalidateQueries({
        queryKey: ['academique', 'classes', 'detail', etablissementId, variables.id],
      })
      setEditingClasse(null)
    },
  })

  function handleEdit(classe) {
    setViewingClasseId(null)
    setEditingClasse(classe)
  }

  if (!isLoadingAnnees && annees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-warning-500/40 p-10 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-warning-500" />
        <p className="font-heading font-semibold text-ink-900 mb-1">Aucune année scolaire</p>
        <p className="text-sm text-ink-500 max-w-md mx-auto">
          Crée d'abord une année scolaire dans l'onglet "Années scolaires" — une
          classe lui est toujours rattachée.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="max-w-xs w-full">
          <Select
            id="annee-filter"
            label="Année scolaire"
            options={anneeOptions}
            value={anneeScolaireId}
            onChange={(e) => setAnneeScolaireId(e.target.value)}
          />
        </div>
        {anneeScolaireId && (
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            disabled={niveauOptions.length === 0}
          >
            <Plus className="h-4 w-4" />
            Créer une classe
          </Button>
        )}
      </div>

      {niveauOptions.length === 0 && (
        <p className="text-sm text-ink-400 mb-4">
          Crée d'abord au moins un niveau dans l'onglet "Niveaux" pour pouvoir créer une classe.
        </p>
      )}

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && (
          <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les classes.</p>
        )}
        {!isLoading && !isError && classes.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <Layers className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucune classe pour cette année scolaire.
          </div>
        )}
        {!isLoading && !isError && classes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Classe</th>
                  <th className="px-4 py-3 font-medium">Niveau</th>
                  <th className="px-4 py-3 font-medium">Série</th>
                  <th className="px-4 py-3 font-medium">Capacité</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((classe) => (
                  <tr
                    key={classe.id}
                    onClick={() => setViewingClasseId(classe.id)}
                    className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-ink-900">{classe.nom}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {NIVEAU_LABELS[classe.niveau?.libelle] ?? classe.niveau?.libelle ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{classe.serie?.libelle ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-600">{classe.capaciteMax ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={classe.actif === false ? 'danger' : 'success'}>
                        {classe.actif === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Créer une classe">
        <ClasseForm
          etablissementId={etablissementId}
          anneeScolaireId={anneeScolaireId}
          niveauOptions={niveauOptions}
          salleOptions={salleOptions}
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>

      <Modal open={Boolean(editingClasse)} onClose={() => setEditingClasse(null)} title="Modifier la classe">
        {editingClasse && (
          <ClasseForm
            etablissementId={etablissementId}
            anneeScolaireId={anneeScolaireId}
            niveauOptions={niveauOptions}
            salleOptions={salleOptions}
            initialValues={editingClasse}
            isSubmitting={updateMutation.isPending}
            onCancel={() => setEditingClasse(null)}
            onSubmit={(payload) => updateMutation.mutateAsync({ id: editingClasse.id, payload })}
          />
        )}
      </Modal>

      <ClasseDetailModal
        etablissementId={etablissementId}
        classeId={viewingClasseId}
        onClose={() => setViewingClasseId(null)}
        onEdit={handleEdit}
      />
    </div>
  )
}
