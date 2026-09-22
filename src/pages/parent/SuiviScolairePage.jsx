import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMesEnfants } from '../../api/portailParent'
import { Select } from '../../components/ui/Select'
import { TabBar } from '../../components/ui/TabBar'
import { ParentNotesTab } from './ParentNotesTab'
import { ParentBulletinsTab } from './ParentBulletinsTab'
import { ParentMoyennesTab } from './ParentMoyennesTab'

const TABS = [
  { key: 'notes', label: 'Notes', Component: ParentNotesTab },
  { key: 'moyennes', label: 'Moyennes', Component: ParentMoyennesTab },
  { key: 'bulletins', label: 'Bulletins', Component: ParentBulletinsTab },
]

export default function SuiviScolairePage() {
  const location = useLocation()
  const [eleveId, setEleveId] = useState('')
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? 'notes')

  const { data, isLoading } = useQuery({
    queryKey: ['portail-parent', 'mes-enfants'],
    queryFn: getMesEnfants,
  })
  const enfants = (Array.isArray(data) ? data : (data?.items ?? [])).map((item) => item.eleve ?? item)
  const enfantOptions = enfants.map((e) => ({ value: e.id, label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() }))

  useEffect(() => {
    if (!eleveId && enfants.length > 0) setEleveId(enfants[0].id)
  }, [enfants, eleveId])

  const etablissementId = enfants.find((e) => e.id === eleveId)?.etablissementId
  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">Suivi scolaire</h1>

      <div className="max-w-xs mb-5">
        <Select
          id="enfant-select"
          label="Enfant"
          options={enfantOptions.length ? enfantOptions : [{ value: '', label: isLoading ? 'Chargement...' : 'Aucun enfant' }]}
          value={eleveId}
          onChange={(e) => setEleveId(e.target.value)}
        />
      </div>

      {eleveId && (
        <>
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

          {ActiveComponent && <ActiveComponent etablissementId={etablissementId} eleveId={eleveId} />}
        </>
      )}
    </div>
  )
}
