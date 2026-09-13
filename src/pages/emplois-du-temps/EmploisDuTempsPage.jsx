import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { searchEtablissements } from '../../api/etablissements'
import { Combobox } from '../../components/ui/Combobox'
import { CoursTab } from './CoursTab'

const TABS = [{ key: 'cours', label: 'Cours', Component: CoursTab }]

export default function EmploisDuTempsPage() {
  const { user } = useAuth()
  const isAdmin = getPrimaryRole(user) === 'ADMINISTRATEUR'
  const [selectedEtabId, setSelectedEtabId] = useState(
    isAdmin ? '' : (user?.etablissementId ?? ''),
  )
  const [activeTab, setActiveTab] = useState('cours')

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
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Emplois du temps</h1>
      <p className="text-sm text-ink-500 mb-6">
        Cours planifiés par classe, base du pointage de présence.
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
          <CalendarClock className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement pour gérer son emploi du temps.
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
