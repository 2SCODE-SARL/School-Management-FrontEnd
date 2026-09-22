import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { searchEtablissements } from '../../api/etablissements'
import { Combobox } from '../../components/ui/Combobox'
import { AnneesTab } from './AnneesTab'
import { NiveauxTab } from './NiveauxTab'
import { SeriesTab } from './SeriesTab'
import { MatieresTab } from './MatieresTab'
import { SallesTab } from './SallesTab'
import { TypesEvaluationTab } from './TypesEvaluationTab'
import { ClassesTab } from './ClassesTab'
import { PonderationsTab } from './PonderationsTab'

const TABS = [
  { key: 'annees', label: 'Années scolaires', Component: AnneesTab },
  { key: 'niveaux', label: 'Niveaux', Component: NiveauxTab },
  { key: 'series', label: 'Séries', Component: SeriesTab },
  { key: 'matieres', label: 'Matières', Component: MatieresTab },
  { key: 'salles', label: 'Salles', Component: SallesTab },
  { key: 'types-evaluation', label: "Types d'évaluation", Component: TypesEvaluationTab },
  { key: 'classes', label: 'Classes', Component: ClassesTab },
  { key: 'ponderations', label: 'Pondérations', Component: PonderationsTab },
]

export default function AcademiquePage() {
  const { user } = useAuth()
  const location = useLocation()
  const isAdmin = getPrimaryRole(user) === 'ADMINISTRATEUR'
  // Arrivée possible depuis une statistique cliquable d'un tableau de bord.
  const [selectedEtabId, setSelectedEtabId] = useState(
    isAdmin ? (location.state?.etablissementId ?? '') : (user?.etablissementId ?? ''),
  )
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? 'annees')
  // Le sous-menu de la sidebar navigue vers ce même chemin avec un nouvel
  // `state.tab` — même route, donc pas de remontage : sans ceci, changer de
  // sous-page depuis un module déjà ouvert resterait sans effet.
  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  // L'Admin gère plusieurs écoles : il doit d'abord choisir laquelle
  // configurer. Le Directeur, lui, n'a que la sienne.
  const { data: etablissementsData } = useQuery({
    queryKey: ['etablissements', 'options'],
    queryFn: () => searchEtablissements({ limit: 100 }),
    enabled: isAdmin,
  })
  const etablissementOptions = (etablissementsData?.items ?? []).map((e) => ({
    value: e.id,
    label: e.nom,
  }))

  const activeTabDef = TABS.find((t) => t.key === activeTab)
  const ActiveComponent = activeTabDef?.Component

  return (
    <div>
      <p className="text-sm font-medium text-ink-400 mb-1">Académique</p>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">{activeTabDef?.label ?? 'Académique'}</h1>

      {isAdmin && (
        <div className="mb-6 max-w-sm">
          <Combobox
            id="etablissement-select"
            label="Établissement"
            options={etablissementOptions}
            value={selectedEtabId}
            onChange={setSelectedEtabId}
            placeholder="Sélectionner un établissement..."
            searchPlaceholder="Rechercher une école..."
          />
        </div>
      )}

      {!selectedEtabId ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
          <Building2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement pour configurer son académique.
        </div>
      ) : (
        ActiveComponent && <ActiveComponent etablissementId={selectedEtabId} />
      )}
    </div>
  )
}
