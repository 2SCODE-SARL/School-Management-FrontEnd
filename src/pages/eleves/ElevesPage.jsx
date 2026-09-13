import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { searchEtablissements } from '../../api/etablissements'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { Combobox } from '../../components/ui/Combobox'
import { ElevesTab } from './ElevesTab'
import { InscriptionsTab } from './InscriptionsTab'
import { ParentsTab } from './ParentsTab'
import { TypesDocumentsTab } from './TypesDocumentsTab'

const TABS = [
  { key: 'eleves', label: 'Élèves', Component: ElevesTab },
  { key: 'inscriptions', label: 'Inscriptions', Component: InscriptionsTab },
  { key: 'parents', label: 'Parents', Component: ParentsTab },
  { key: 'types-documents', label: 'Types de documents', Component: TypesDocumentsTab },
]

export default function ElevesPage() {
  const { user } = useAuth()
  const isAdmin = getPrimaryRole(user) === 'ADMINISTRATEUR'
  const [selectedEtabId, setSelectedEtabId] = useState(
    isAdmin ? '' : (user?.etablissementId ?? ''),
  )
  const [activeTab, setActiveTab] = useState('eleves')

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
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Élèves & Inscriptions</h1>
      <p className="text-sm text-ink-500 mb-6">
        Fiches des élèves, préinscription, affectation et réinscription.
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
          <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement pour voir ses élèves.
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
