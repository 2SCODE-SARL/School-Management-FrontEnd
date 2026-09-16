import { ArrowRight } from 'lucide-react'
import { ApiErrorMessage } from './ApiErrorMessage'

/**
 * Carte "aperçu de liste" pour les tableaux de bord : titre (+ total
 * optionnel), quelques éléments (`items`, déjà tronqués par l'appelant —
 * ex: `.slice(0, 5)`), et un lien "Voir tout" vers la liste complète du
 * module concerné. `renderItem` décrit chaque ligne (forme libre selon le
 * contexte : élève, demande, réclamation...). `isError`/`error` optionnels
 * — sans ça, une requête en échec se confondait silencieusement avec une
 * liste vide ("Rien à afficher").
 */
export function DashboardListCard({
  title,
  total,
  items,
  renderItem,
  emptyMessage = 'Rien à afficher pour l’instant.',
  onSeeAll,
  isLoading,
  isError,
  error,
}) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-ink-100">
        <p className="font-heading font-semibold text-ink-900">
          {title}
          {typeof total === 'number' && <span className="text-ink-400 font-normal ml-1.5">({total})</span>}
        </p>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 shrink-0 transition-colors"
          >
            Voir tout
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      ) : isError ? (
        <ApiErrorMessage error={error} fallback="Impossible de charger." className="p-6 text-center text-sm text-danger-600" />
      ) : items.length === 0 ? (
        <p className="p-6 text-center text-sm text-ink-400">{emptyMessage}</p>
      ) : (
        <div className="divide-y divide-ink-50">{items.map(renderItem)}</div>
      )}
    </div>
  )
}
