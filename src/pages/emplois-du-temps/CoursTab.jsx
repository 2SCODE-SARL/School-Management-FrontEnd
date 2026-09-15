import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock, Plus } from 'lucide-react'
import { createCours, listCours } from '../../api/emploisDuTemps'
import { listClasses } from '../../api/academique'
import { listAnneesScolaires } from '../../api/etablissements'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Badge } from '../../components/ui/Badge'
import {
  COURS_STATUT_LABELS,
  COURS_STATUT_OPTIONS,
  JOUR_SEMAINE_LABELS,
  coursStatutBadgeVariant,
} from '../../config/emploiDuTempsLabels'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'
import { CoursForm } from './CoursForm'
import { CoursDetailModal } from './CoursDetailModal'

export function CoursTab({ etablissementId }) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [classeId, setClasseId] = useState('')
  const [etatFilter, setEtatFilter] = useState('')
  const [search, setSearch] = useState('')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [viewingCoursId, setViewingCoursId] = useState(null)
  const queryClient = useQueryClient()

  const { data: anneesData, isLoading: isLoadingAnnees } = useQuery({
    queryKey: ['academique', 'annees', etablissementId],
    queryFn: () => listAnneesScolaires(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const annees = Array.isArray(anneesData) ? anneesData : (anneesData?.items ?? [])
  const anneeOptions = annees.map((a) => ({ value: a.id, label: a.libelle }))

  // Un id d'année (ou de classe, plus bas) d'un AUTRE établissement ne doit
  // jamais survivre à un changement d'établissement (confirmé par le
  // backend : sinon "année scolaire introuvable" pour ce tenant).
  useEffect(() => {
    setAnneeScolaireId('')
  }, [etablissementId])

  useEffect(() => {
    if (anneeScolaireId || annees.length === 0) return
    const enCours = annees.find((a) => a.statut === 'EN_COURS')
    const fallback = annees.slice().sort((a, b) => (b.dateDebut ?? '').localeCompare(a.dateDebut ?? ''))[0]
    setAnneeScolaireId((enCours ?? fallback)?.id ?? '')
  }, [annees, anneeScolaireId])

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['academique', 'classes', etablissementId, anneeScolaireId],
    queryFn: () => listClasses(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })
  const classes = Array.isArray(classesData) ? classesData : (classesData?.items ?? [])
  const classeOptions = classes.map((c) => ({
    value: c.id,
    label: `${c.nom} (${NIVEAU_LABELS[c.niveau?.libelle] ?? c.niveau?.libelle ?? ''})`,
  }))

  // Idem : une classe d'une autre année ne doit pas survivre au changement
  // d'année scolaire.
  useEffect(() => {
    setClasseId('')
  }, [anneeScolaireId])

  useEffect(() => {
    if (classeId || classes.length === 0) return
    setClasseId(classes[0].id)
  }, [classes, classeId])

  const coursQueryKey = ['emplois-du-temps', 'cours', etablissementId, classeId]
  const { data: coursData, isLoading, isError } = useQuery({
    queryKey: coursQueryKey,
    queryFn: () => listCours(etablissementId, { classeId }),
    enabled: Boolean(etablissementId && classeId),
  })
  // `etat`/recherche enseignant+salle : pas de filtre équivalent côté API
  // (seuls classeId/employeId/jourSemaine existent), donc filtrage client
  // sur la liste déjà chargée pour cette classe.
  const searchNormalized = search.trim().toLowerCase()
  const cours = (Array.isArray(coursData) ? coursData : (coursData?.items ?? []))
    .filter((c) => !etatFilter || (c.etat ?? 'PLANIFIE') === etatFilter)
    .filter((c) => {
      if (!searchNormalized) return true
      const enseignant = `${c.employe?.prenom ?? ''} ${c.employe?.nom ?? ''}`.toLowerCase()
      const salle = (c.salle?.numero ?? '').toLowerCase()
      return enseignant.includes(searchNormalized) || salle.includes(searchNormalized)
    })
    .slice()
    .sort((a, b) => (a.jourSemaine ?? 0) - (b.jourSemaine ?? 0) || (a.heureDebut ?? '').localeCompare(b.heureDebut ?? ''))

  const createMutation = useMutation({
    mutationFn: (payload) => createCours(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursQueryKey })
      setCreateOpen(false)
    },
  })

  if (!isLoadingAnnees && annees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-warning-500/40 p-10 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-warning-500" />
        <p className="font-heading font-semibold text-ink-900 mb-1">Aucune année scolaire</p>
        <p className="text-sm text-ink-500 max-w-md mx-auto">
          Crée d'abord une année scolaire dans l'onglet Académique.
        </p>
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
              onChange={(e) => {
                setAnneeScolaireId(e.target.value)
                setClasseId('')
              }}
            />
          </div>
          <div className="max-w-xs w-full">
            <Select
              id="classe-filter"
              label="Classe"
              options={
                classeOptions.length ? classeOptions : [{ value: '', label: 'Aucune classe pour cette année' }]
              }
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
            />
          </div>
          <div className="max-w-[10rem] w-full">
            <Select
              id="etat-filter"
              label="Statut"
              options={[{ value: '', label: 'Tous' }, ...COURS_STATUT_OPTIONS]}
              value={etatFilter}
              onChange={(e) => setEtatFilter(e.target.value)}
            />
          </div>
          <div className="max-w-xs w-full">
            <TextField
              id="cours-search"
              label="Enseignant ou salle"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
            />
          </div>
        </div>
        {classeId && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau cours
          </Button>
        )}
      </div>

      {!classeId ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
          {isLoadingClasses ? 'Chargement des classes...' : "Crée d'abord une classe dans Académique pour planifier des cours."}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
          {isLoading && (
            <div className="p-12 flex justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
            </div>
          )}
          {isError && (
            <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les cours.</p>
          )}
          {!isLoading && !isError && cours.length === 0 && (
            <div className="p-16 text-center text-ink-400">
              <CalendarClock className="h-8 w-8 mx-auto mb-3 opacity-50" />
              {etatFilter || searchNormalized
                ? 'Aucun cours ne correspond à ces filtres.'
                : 'Aucun cours planifié pour cette classe.'}
            </div>
          )}
          {!isLoading && !isError && cours.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50/80">
                  <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                    <th className="px-4 py-3 font-medium">Jour</th>
                    <th className="px-4 py-3 font-medium">Horaire</th>
                    <th className="px-4 py-3 font-medium">Matière</th>
                    <th className="px-4 py-3 font-medium">Enseignant</th>
                    <th className="px-4 py-3 font-medium">Salle</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {cours.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setViewingCoursId(c.id)}
                      className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-ink-900">
                        {JOUR_SEMAINE_LABELS[c.jourSemaine] ?? c.jourSemaine}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{c.heureDebut}–{c.heureFin}</td>
                      <td className="px-4 py-3 text-ink-600">{c.matiere?.intitule ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-600">
                        {`${c.employe?.prenom ?? ''} ${c.employe?.nom ?? ''}`.trim() || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{c.salle?.numero ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={coursStatutBadgeVariant(c.etat)}>
                          {COURS_STATUT_LABELS[c.etat] ?? c.etat ?? 'Planifié'}
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

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Nouveau cours" maxWidth="max-w-lg">
        <CoursForm
          etablissementId={etablissementId}
          classeId={classeId}
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>

      <CoursDetailModal
        etablissementId={etablissementId}
        classeId={classeId}
        coursId={viewingCoursId}
        onClose={() => setViewingCoursId(null)}
      />
    </div>
  )
}
