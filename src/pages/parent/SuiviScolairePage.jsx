import { useEffect, useState } from 'react'
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
  const [eleveId, setEleveId] = useState('')
  const [activeTab, setActiveTab] = useState('notes')

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
          <div className="flex flex-wrap gap-1 border-b border-ink-200 mb-5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-ink-500 hover:text-ink-700',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {ActiveComponent && <ActiveComponent etablissementId={etablissementId} eleveId={eleveId} />}
        </>
      )}
    </div>
  )
}
