import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Trophy } from 'lucide-react'
import { getClassement } from '../../api/resultats'
import { listClasses } from '../../api/academique'
import { getAnneeScolaire, listAnneesScolaires } from '../../api/etablissements'
import { listElevesClasse } from '../../api/eleves'
import { Select } from '../../components/ui/Select'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'

export function ClassementsTab({ etablissementId }) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [trimestreId, setTrimestreId] = useState('')
  const [classeId, setClasseId] = useState('')

  const { data: anneesData, isLoading: isLoadingAnnees } = useQuery({
    queryKey: ['academique', 'annees', etablissementId],
    queryFn: () => listAnneesScolaires(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const annees = Array.isArray(anneesData) ? anneesData : (anneesData?.items ?? [])
  const anneeOptions = annees.map((a) => ({ value: a.id, label: a.libelle }))

  useEffect(() => {
    setAnneeScolaireId('')
  }, [etablissementId])

  useEffect(() => {
    if (anneeScolaireId || annees.length === 0) return
    const enCours = annees.find((a) => a.statut === 'EN_COURS')
    const fallback = annees.slice().sort((a, b) => (b.dateDebut ?? '').localeCompare(a.dateDebut ?? ''))[0]
    setAnneeScolaireId((enCours ?? fallback)?.id ?? '')
  }, [annees, anneeScolaireId])

  const { data: anneeDetail } = useQuery({
    queryKey: ['academique', 'annee-detail', etablissementId, anneeScolaireId],
    queryFn: () => getAnneeScolaire(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })
  const trimestres = anneeDetail?.trimestres ?? []
  const trimestreOptions = trimestres.map((t, i) => ({ value: t.id, label: t.libelle ?? `Trimestre ${i + 1}` }))

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

  // Confirmé par un vrai payload : le classement ne renvoie que
  // `{ eleveId, moyenne, rang }`, aucune info sur l'élève — on résout le
  // nom via le roster de la classe (nouvel endpoint ajouté par le backend).
  const { data: elevesData } = useQuery({
    queryKey: ['eleves', 'classe-roster', etablissementId, classeId],
    queryFn: () => listElevesClasse(etablissementId, classeId, { limit: 100 }),
    enabled: Boolean(etablissementId && classeId),
  })
  const eleveLabelById = Object.fromEntries(
    (elevesData?.items ?? []).map((e) => [e.id, `${e.prenom ?? ''} ${e.nom ?? ''}`.trim()]),
  )

  const { data, isLoading, isError } = useQuery({
    queryKey: ['resultats', 'classement', etablissementId, classeId, trimestreId],
    queryFn: () => getClassement(etablissementId, classeId, trimestreId),
    enabled: Boolean(etablissementId && classeId && trimestreId),
  })
  const classement = (Array.isArray(data) ? data : (data?.items ?? []))
    .slice()
    .sort((a, b) => (a.rang ?? 999) - (b.rang ?? 999))

  if (!isLoadingAnnees && annees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-warning-500/40 p-10 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-warning-500" />
        <p className="font-heading font-semibold text-ink-900 mb-1">Aucune année scolaire</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="max-w-xs w-full">
          <Select id="annee-filter" label="Année scolaire" options={anneeOptions} value={anneeScolaireId} onChange={(e) => setAnneeScolaireId(e.target.value)} />
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
            options={classeOptions.length ? classeOptions : [{ value: '', label: 'Aucune classe' }]}
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger le classement.</p>}
        {!isLoading && !isError && classement.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <Trophy className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun classement disponible (bulletins pas encore générés ?).
          </div>
        )}
        {!isLoading && !isError && classement.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Rang</th>
                  <th className="px-4 py-3 font-medium">Élève</th>
                  <th className="px-4 py-3 font-medium">Moyenne</th>
                </tr>
              </thead>
              <tbody>
                {classement.map((c, i) => (
                  <tr key={c.eleveId ?? c.id ?? i} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3 font-semibold text-ink-900">{c.rang ?? i + 1}</td>
                    <td className="px-4 py-3 text-ink-900">{eleveLabelById[c.eleveId] || c.eleveId}</td>
                    <td className="px-4 py-3 text-ink-600">{c.moyenne ?? '—'}/20</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
