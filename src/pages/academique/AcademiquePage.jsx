import { useState } from 'react'
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
  const isAdmin = getPrimaryRole(user) === 'ADMINISTRATEUR'
  const [selectedEtabId, setSelectedEtabId] = useState(
    isAdmin ? '' : (user?.etablissementId ?? ''),
  )
  const [activeTab, setActiveTab] = useState('annees')

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

  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Académique</h1>
      <p className="text-sm text-ink-500 mb-6">
        Niveaux, séries, matières, salles et types d'évaluation de l'établissement.
      </p>

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
        <>
          <div className="flex flex-wrap gap-1 border-b border-ink-200 mb-5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-ink-500 hover:text-ink-700',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {ActiveComponent && <ActiveComponent etablissementId={selectedEtabId} />}
        </>
      )}
    </div>
  )
}
