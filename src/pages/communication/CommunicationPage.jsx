import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { searchEtablissements } from '../../api/etablissements'
import { Combobox } from '../../components/ui/Combobox'
import { TemplatesTab } from './TemplatesTab'
import { EnvoyerNotificationTab } from './EnvoyerNotificationTab'

// Modèles : Admin/Directeur seulement (tags Swagger). Envoyer une
// notification : Admin/Directeur/Secrétaire.
const ALL_TABS = [
  { key: 'envoyer', label: 'Envoyer une notification', Component: EnvoyerNotificationTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'SECRETAIRE'] },
  { key: 'templates', label: 'Modèles de message', Component: TemplatesTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR'] },
]

export default function CommunicationPage() {
  const { user } = useAuth()
  const location = useLocation()
  const role = getPrimaryRole(user)
  const isAdmin = role === 'ADMINISTRATEUR'
  const TABS = ALL_TABS.filter((t) => t.roles.includes(role))
  const [selectedEtabId, setSelectedEtabId] = useState(isAdmin ? '' : (user?.etablissementId ?? ''))
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? TABS[0]?.key ?? '')
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
      <p className="text-sm font-medium text-ink-400 mb-1">Communication</p>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">{activeTabDef?.label ?? 'Communication'}</h1>

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
          <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement.
        </div>
      ) : (
        ActiveComponent && <ActiveComponent etablissementId={selectedEtabId} />
      )}
    </div>
  )
}
