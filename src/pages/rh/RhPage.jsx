import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { IdCard } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { searchEtablissements } from '../../api/etablissements'
import { listComptesEnAttente } from '../../api/rh'
import { Combobox } from '../../components/ui/Combobox'
import { TabBar } from '../../components/ui/TabBar'
import { RhDashboardTab } from './RhDashboardTab'
import { EmployesTab } from './EmployesTab'
import { ComptesEnAttenteTab } from './ComptesEnAttenteTab'
import { PaieTab } from '../finances/PaieTab'

// La Paie vivait dans Finances — regroupée ici avec le reste RH (fiches
// employés, comptes). Le Comptable, qui n'avait jusqu'ici que Finances,
// gagne donc l'accès à ce module mais uniquement pour cet onglet (voir le
// filtre par rôle plus bas et `COMPTABLE_BUILT_PAGES` dans App.jsx).
const ALL_TABS = [
  { key: 'dashboard', label: 'Tableau de bord', Component: RhDashboardTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'SECRETAIRE'] },
  { key: 'employes', label: 'Employés', Component: EmployesTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'SECRETAIRE'] },
  { key: 'paie', label: 'Paie', Component: PaieTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'COMPTABLE'] },
  { key: 'comptes-en-attente', label: 'Comptes en attente', Component: ComptesEnAttenteTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'SECRETAIRE'], requires: 'view' },
]

export default function RhPage() {
  const { user } = useAuth()
  const location = useLocation()
  const role = getPrimaryRole(user)
  const isAdmin = role === 'ADMINISTRATEUR'
  // Modifier/désactiver une fiche, valider/refuser un compte : Admin/Directeur
  // seulement. Le Secrétaire peut créer une fiche, provisionner un compte,
  // et depuis peu CONSULTER la liste des comptes en attente (pour voir le
  // statut de ses propres provisionnements) — mais pas la traiter.
  const canManageComptes = isAdmin || role === 'DIRECTEUR'
  const canViewComptesEnAttente = canManageComptes || role === 'SECRETAIRE'
  const TABS = ALL_TABS.filter(
    (t) => t.roles.includes(role) && (t.requires !== 'view' || canViewComptesEnAttente),
  )
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

  // Même queryKey que ComptesEnAttenteTab : react-query mutualise l'appel
  // réseau, ça ne double pas la requête.
  const { data: enAttenteData } = useQuery({
    queryKey: ['rh', 'comptes-en-attente', selectedEtabId],
    queryFn: () => listComptesEnAttente(selectedEtabId),
    enabled: Boolean(selectedEtabId) && canViewComptesEnAttente,
  })
  const comptesEnAttenteCount = (Array.isArray(enAttenteData) ? enAttenteData : (enAttenteData?.items ?? [])).length

  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Ressources humaines</h1>
      <p className="text-sm text-ink-500 mb-6">
        Fiches employés, comptes de connexion du personnel et paie.
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
          <IdCard className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement pour gérer ses employés.
        </div>
      ) : (
        <>
          {TABS.length > 1 && (
            <TabBar
              tabs={TABS.map((tab) => ({
                ...tab,
                badge:
                  tab.key === 'comptes-en-attente' && comptesEnAttenteCount > 0 ? (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-danger-500 text-white text-xs font-semibold">
                      {comptesEnAttenteCount}
                    </span>
                  ) : null,
              }))}
              active={activeTab}
              onChange={setActiveTab}
            />
          )}

          {ActiveComponent && (
            <ActiveComponent
              etablissementId={selectedEtabId}
              canManageComptes={canManageComptes}
              canViewComptesEnAttente={canViewComptesEnAttente}
              onGoToTab={setActiveTab}
            />
          )}
        </>
      )}
    </div>
  )
}
