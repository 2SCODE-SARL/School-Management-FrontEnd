import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GraduationCap } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { searchEtablissements } from '../../api/etablissements'
import { Combobox } from '../../components/ui/Combobox'
import { TabBar } from '../../components/ui/TabBar'
import { ExamensTab } from './ExamensTab'
import { ClassementsTab } from './ClassementsTab'
import { BulletinGenererTab } from './BulletinGenererTab'
import { DeliberationsTab } from './DeliberationsTab'
import { ReclamationsTab } from './ReclamationsTab'
import { AppreciationsTab } from './AppreciationsTab'

// Réclamations : refondu par le backend suite à notre remontée -7 —
// `GET .../reclamations` est maintenant scopé à l'Enseignant lui-même
// ("uniquement les réclamations qui lui sont affectées"), Admin/Directeur
// n'y ont plus accès du tout (changement de rôle intentionnel).
// Appréciations : Enseignant/Directeur/Admin (par matière) ; avis de
// direction dans le même onglet mais réservé Directeur/Admin (voir
// `canAvisDirection` dans AppreciationsTab).
const ALL_TABS = [
  { key: 'examens', label: 'Examens', Component: ExamensTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'ENSEIGNANT'] },
  { key: 'classements', label: 'Classements', Component: ClassementsTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'ENSEIGNANT'] },
  {
    key: 'appreciations',
    label: 'Appréciations',
    Component: AppreciationsTab,
    roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'ENSEIGNANT'],
    extraProps: (role) => ({ canAvisDirection: role === 'ADMINISTRATEUR' || role === 'DIRECTEUR' }),
  },
  { key: 'bulletins', label: 'Bulletins', Component: BulletinGenererTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR'] },
  { key: 'deliberations', label: 'Délibérations', Component: DeliberationsTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR'] },
  { key: 'reclamations', label: 'Réclamations', Component: ReclamationsTab, roles: ['ENSEIGNANT'] },
]

export default function ResultatsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const role = getPrimaryRole(user)
  const isAdmin = role === 'ADMINISTRATEUR'
  const TABS = ALL_TABS.filter((t) => t.roles.includes(role))
  // Arrivée possible depuis une statistique cliquable d'un tableau de bord.
  const [selectedEtabId, setSelectedEtabId] = useState(
    isAdmin ? (location.state?.etablissementId ?? '') : (user?.etablissementId ?? ''),
  )
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? TABS[0]?.key ?? 'examens')

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
  const extraProps = activeTabDef?.extraProps ? activeTabDef.extraProps(role) : {}

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Résultats</h1>
      <p className="text-sm text-ink-500 mb-6">Examens, saisie des notes et publication.</p>

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
          <GraduationCap className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement pour gérer ses résultats.
        </div>
      ) : (
        <>
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

          {ActiveComponent && <ActiveComponent etablissementId={selectedEtabId} {...extraProps} />}
        </>
      )}
    </div>
  )
}
