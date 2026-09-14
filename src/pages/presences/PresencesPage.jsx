import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { searchEtablissements } from '../../api/etablissements'
import { Combobox } from '../../components/ui/Combobox'
import { TabBar } from '../../components/ui/TabBar'
import { PersonnelTab } from './PersonnelTab'
import { AccesTab } from './AccesTab'
import { AlertesTab } from './AlertesTab'

// Reflète les tags Swagger réels : Personnel = Admin/Directeur/Enseignant,
// Accès et Alertes = Admin/Directeur/Surveillant (pas Enseignant).
const ALL_TABS = [
  { key: 'personnel', label: 'Présence du personnel', Component: PersonnelTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'ENSEIGNANT'] },
  { key: 'acces', label: 'Accès élèves', Component: AccesTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'SURVEILLANT'] },
  { key: 'alertes', label: 'Alertes', Component: AlertesTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'SURVEILLANT'] },
]

export default function PresencesPage() {
  const { user } = useAuth()
  const location = useLocation()
  const role = getPrimaryRole(user)
  const isAdmin = role === 'ADMINISTRATEUR'
  const TABS = ALL_TABS.filter((t) => t.roles.includes(role))
  // Arrivée possible depuis une statistique cliquable d'un tableau de bord.
  const [selectedEtabId, setSelectedEtabId] = useState(
    isAdmin ? (location.state?.etablissementId ?? '') : (user?.etablissementId ?? ''),
  )
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? TABS[0]?.key ?? '')

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
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Présences</h1>
      <p className="text-sm text-ink-500 mb-6">
        Présence du personnel, accès des élèves et alertes de l'établissement.
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
          <ClipboardCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement.
        </div>
      ) : TABS.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
          Rien à afficher pour ton rôle pour l'instant.
        </div>
      ) : (
        <>
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

          {ActiveComponent && <ActiveComponent etablissementId={selectedEtabId} />}
        </>
      )}
    </div>
  )
}
