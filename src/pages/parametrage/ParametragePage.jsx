import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { searchEtablissements } from '../../api/etablissements'
import { Combobox } from '../../components/ui/Combobox'
import { AnneesTab } from '../academique/AnneesTab'
import { ParametresTab } from './ParametresTab'

const TABS = [
  { key: 'annees', label: 'Années scolaires', Component: AnneesTab },
  { key: 'parametres', label: 'Paramètres', Component: ParametresTab },
]

export default function ParametragePage() {
  const { user } = useAuth()
  const location = useLocation()
  const isAdmin = getPrimaryRole(user) === 'ADMINISTRATEUR'
  const [etablissementId, setEtablissementId] = useState(isAdmin ? '' : (user?.etablissementId ?? ''))
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? 'annees')
  // Le sous-menu de la sidebar navigue vers ce même chemin avec un nouvel
  // `state.tab` — même route, donc pas de remontage : sans ceci, changer de
  // sous-page depuis un module déjà ouvert resterait sans effet.
  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  const { data: etablissementsData } = useQuery({
    queryKey: ['etablissements', 'options'],
    queryFn: () => searchEtablissements({ limit: 100 }),
    enabled: isAdmin,
  })
  const etablissementOptions = (etablissementsData?.items ?? []).map((e) => ({ value: e.id, label: e.nom }))

  const activeTabDef = TABS.find((t) => t.key === activeTab)
  const ActiveComponent = activeTabDef?.Component

  return (
    <div>
      <p className="text-sm font-medium text-ink-400 mb-1">Paramétrage</p>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">{activeTabDef?.label ?? 'Paramétrage'}</h1>

      {isAdmin && (
        <div className="mb-6 max-w-sm">
          <Combobox
            id="etablissement-select"
            label="Établissement"
            options={etablissementOptions}
            value={etablissementId}
            onChange={setEtablissementId}
            placeholder="Sélectionner un établissement..."
            searchPlaceholder="Rechercher une école..."
          />
        </div>
      )}

      {!etablissementId ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
          <Settings className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement.
        </div>
      ) : (
        ActiveComponent && <ActiveComponent etablissementId={etablissementId} />
      )}
    </div>
  )
}
