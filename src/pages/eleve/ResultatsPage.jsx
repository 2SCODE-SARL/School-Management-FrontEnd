import { useState } from 'react'
import { NotesTab } from './NotesTab'
import { MoyennesTab } from './MoyennesTab'
import { BulletinsTab } from './BulletinsTab'

const TABS = [
  { key: 'notes', label: 'Notes', Component: NotesTab },
  { key: 'moyennes', label: 'Moyennes', Component: MoyennesTab },
  { key: 'bulletins', label: 'Bulletins', Component: BulletinsTab },
]

export default function ResultatsPage() {
  const [activeTab, setActiveTab] = useState('notes')
  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">Résultats</h1>

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

      {ActiveComponent && <ActiveComponent />}
    </div>
  )
}
