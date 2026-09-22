import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMesEnfants } from '../../api/portailParent'
import { Select } from '../../components/ui/Select'
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
  // Le sous-menu de la sidebar navigue vers ce même chemin avec un nouvel
  // `state.tab` — même route, donc pas de remontage : sans ceci, changer de
  // sous-page depuis le module déjà ouvert resterait sans effet.
  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

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
  const activeTabDef = TABS.find((t) => t.key === activeTab)
  const ActiveComponent = activeTabDef?.Component

  return (
    <div>
      <p className="text-sm font-medium text-ink-400 mb-1">Suivi scolaire</p>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">{activeTabDef?.label ?? 'Suivi scolaire'}</h1>

      <div className="max-w-xs mb-5">
        <Select
          id="enfant-select"
          label="Enfant"
          options={enfantOptions.length ? enfantOptions : [{ value: '', label: isLoading ? 'Chargement...' : 'Aucun enfant' }]}
          value={eleveId}
          onChange={(e) => setEleveId(e.target.value)}
        />
      </div>

      {eleveId && ActiveComponent && <ActiveComponent etablissementId={etablissementId} eleveId={eleveId} />}
    </div>
  )
}
