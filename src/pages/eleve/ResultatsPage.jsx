import { useState } from 'react'
import { TabBar } from '../../components/ui/TabBar'
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

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {ActiveComponent && <ActiveComponent />}
    </div>
  )
}
