import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FolderOpen } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { searchEtablissements } from '../../api/etablissements'
import { Combobox } from '../../components/ui/Combobox'
import { TabBar } from '../../components/ui/TabBar'
import { DocumentsTab } from './DocumentsTab'
import { ModelesTab } from './ModelesTab'
import { ImportExportTab } from './ImportExportTab'

// Module Documentation — Admin/Directeur/Secrétaire (tags Swagger).
const TABS = [
  { key: 'documents', label: 'Documents', Component: DocumentsTab },
  { key: 'modeles', label: 'Modèles', Component: ModelesTab },
  { key: 'import-export', label: 'Import / Export', Component: ImportExportTab },
]

export default function DocumentationPage() {
  const { user } = useAuth()
  const isAdmin = getPrimaryRole(user) === 'ADMINISTRATEUR'
  const [selectedEtabId, setSelectedEtabId] = useState(isAdmin ? '' : (user?.etablissementId ?? ''))
  const [activeTab, setActiveTab] = useState('documents')

  const { data: etablissementsData } = useQuery({
    queryKey: ['etablissements', 'options'],
    queryFn: () => searchEtablissements({ limit: 100 }),
    enabled: isAdmin,
  })
  const etablissementOptions = (etablissementsData?.items ?? []).map((e) => ({ value: e.id, label: e.nom }))

  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Documentation</h1>
      <p className="text-sm text-ink-500 mb-6">Documents, modèles et transferts de données de l'établissement.</p>

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
          <FolderOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement.
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
