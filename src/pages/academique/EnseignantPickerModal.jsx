import { useState } from 'react'
import { Search, UserX } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'

/**
 * Popup de sélection d'un enseignant : recherche + tableau cliquable,
 * plutôt qu'un <select> difficile à parcourir dès que la liste s'allonge.
 */
export function EnseignantPickerModal({ open, onClose, employes, onSelect }) {
  const [search, setSearch] = useState('')

  const filtered = employes.filter((e) =>
    `${e.prenom ?? ''} ${e.nom ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  )

  function handleSelect(id) {
    onSelect(id)
    setSearch('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Choisir un enseignant" maxWidth="max-w-md">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="search"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un enseignant..."
          className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
        />
      </div>

      <div className="border border-ink-100 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <tbody>
            <tr
              onClick={() => handleSelect('')}
              className="cursor-pointer hover:bg-ink-50 border-b border-ink-50 transition-colors"
            >
              <td className="px-4 py-2.5 text-ink-400 flex items-center gap-2">
                <UserX className="h-3.5 w-3.5" />
                Non affecté pour le moment
              </td>
            </tr>
            {filtered.map((e) => (
              <tr
                key={e.id}
                onClick={() => handleSelect(e.id)}
                className="cursor-pointer hover:bg-ink-50 border-b border-ink-50 last:border-0 transition-colors"
              >
                <td className="px-4 py-2.5 font-medium text-ink-900">
                  {e.prenom} {e.nom}
                </td>
                <td className="px-4 py-2.5 text-ink-400 text-xs text-right whitespace-nowrap">
                  {(e.matieres ?? []).length} matière(s) habilitée(s)
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-ink-400" colSpan={2}>
                  Aucun résultat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
