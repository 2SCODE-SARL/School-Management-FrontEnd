import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Wallet } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { searchEtablissements } from '../../api/etablissements'
import { Combobox } from '../../components/ui/Combobox'
import { TypesFraisTab } from './TypesFraisTab'
import { EcheancesTab } from './EcheancesTab'
import { ImpayesTab } from './ImpayesTab'
import { EncaissementsTab } from './EncaissementsTab'
import { DepensesTab } from './DepensesTab'
import { BudgetsTab } from './BudgetsTab'

// Rôles confirmés via les tags Swagger — pas uniformes d'un sous-module à
// l'autre (ex: Secrétaire a Échéances/Impayés/Encaissements mais pas
// Frais/Dépenses/Budgets). La Paie a été déplacée dans Ressources humaines
// (RhPage) — regroupement demandé, le Comptable y a maintenant accès en plus
// de son module Finances.
const ALL_TABS = [
  { key: 'frais', label: 'Frais & Réductions', Component: TypesFraisTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR'] },
  {
    key: 'echeances',
    label: 'Échéances',
    Component: EcheancesTab,
    roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'SECRETAIRE', 'COMPTABLE'],
    // Générer les échéances / appliquer une réduction restent Admin/Directeur uniquement (voir la doc du DTO).
    extraProps: (role) => ({ canGererFrais: role === 'ADMINISTRATEUR' || role === 'DIRECTEUR' }),
  },
  { key: 'impayes', label: 'Impayés', Component: ImpayesTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'SECRETAIRE', 'COMPTABLE'] },
  { key: 'encaissements', label: 'Encaissements', Component: EncaissementsTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'SECRETAIRE', 'COMPTABLE'] },
  {
    key: 'depenses',
    label: 'Dépenses',
    Component: DepensesTab,
    roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'COMPTABLE'],
    extraProps: (role) => ({ canValider: role === 'ADMINISTRATEUR' || role === 'DIRECTEUR' }),
  },
  { key: 'budgets', label: 'Budgets', Component: BudgetsTab, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'COMPTABLE'] },
]

export default function FinancesPage() {
  const { user } = useAuth()
  const location = useLocation()
  const role = getPrimaryRole(user)
  const isAdmin = role === 'ADMINISTRATEUR'
  const TABS = ALL_TABS.filter((t) => t.roles.includes(role))
  // `location.state` : arrivée depuis une statistique cliquable du tableau
  // de bord (voir DirecteurDashboard/AdminDashboard) — ouvre directement le
  // bon onglet (et le bon établissement pour l'Admin) au lieu de l'onglet
  // par défaut.
  const [selectedEtabId, setSelectedEtabId] = useState(
    isAdmin ? (location.state?.etablissementId ?? '') : (user?.etablissementId ?? ''),
  )
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
  const etablissementOptions = (etablissementsData?.items ?? []).map((e) => ({
    value: e.id,
    label: e.nom,
  }))

  const activeTabDef = TABS.find((t) => t.key === activeTab)
  const ActiveComponent = activeTabDef?.Component
  const extraProps = activeTabDef?.extraProps ? activeTabDef.extraProps(role) : {}

  return (
    <div>
      <p className="text-sm font-medium text-ink-400 mb-1">Scolarité</p>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">{activeTabDef?.label ?? 'Scolarité'}</h1>

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
          <Wallet className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement pour gérer ses finances.
        </div>
      ) : TABS.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
          <Wallet className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucun sous-module Finances n'est accessible pour ton rôle.
        </div>
      ) : (
        <>{ActiveComponent && <ActiveComponent etablissementId={selectedEtabId} {...extraProps} />}</>
      )}
    </div>
  )
}
