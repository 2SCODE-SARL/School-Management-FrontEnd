import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMesEnfants } from '../../api/portailParent'
import { Select } from '../../components/ui/Select'
import { ParentPresencesTab } from './ParentPresencesTab'
import { ParentAccesTab } from './ParentAccesTab'

const TABS = [
  { key: 'presences', label: 'Présences', Component: ParentPresencesTab },
  { key: 'acces', label: 'Entrées/sorties', Component: ParentAccesTab },
]

export default function PresencesAccesPage() {
  const [eleveId, setEleveId] = useState('')
  const [activeTab, setActiveTab] = useState('presences')

  const { data, isLoading } = useQuery({
    queryKey: ['portail-parent', 'mes-enfants'],
    queryFn: getMesEnfants,
  })
  const enfants = (Array.isArray(data) ? data : (data?.items ?? [])).map((item) => item.eleve ?? item)
  const enfantOptions = enfants.map((e) => ({ value: e.id, label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() }))

  useEffect(() => {
    if (!eleveId && enfants.length > 0) setEleveId(enfants[0].id)
  }, [enfants, eleveId])

  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">Présences &amp; accès</h1>

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

          {ActiveComponent && <ActiveComponent eleveId={eleveId} />}
        </>
      )}
    </div>
  )
}
