import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { TabBar } from '../../components/ui/TabBar'
import { CountriesTab } from './CountriesTab'
import { LanguagesTab } from './LanguagesTab'
import { CurrenciesTab } from './CurrenciesTab'

const TABS = [
  { key: 'pays', label: 'Pays', Component: CountriesTab },
  { key: 'langues', label: 'Langues', Component: LanguagesTab },
  { key: 'devises', label: 'Devises', Component: CurrenciesTab },
]

/**
 * Données de référence du module Formation (marketplace de cours) : pays,
 * langues et devises, nécessaires avant qu'un formateur puisse créer son
 * profil ou un cours (`nationalityCountryId`, `targetCountryId`,
 * `languageId`, `currencyId`...). Portée plateforme, pas d'établissement —
 * à la différence des référentiels académiques habituels.
 */
export default function ReferentielsPage() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? 'pays')

  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component

  return (
    <div>
      <p className="text-sm font-medium text-ink-400 mb-1">Formation</p>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">Référentiels</h1>
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      {ActiveComponent && <ActiveComponent />}
    </div>
  )
}
