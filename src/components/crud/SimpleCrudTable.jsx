import { LoaderCircle, Pencil, Power } from 'lucide-react'

/**
 * Tableau générique pour une ressource simple (pas de recherche/pagination —
 * ces listes académiques restent courtes). `columns`: [{ key, label, render?(item) }].
 * `onEdit`/`onToggleActive` omis -> pas de colonne Actions pour cette ressource
 * (ex: types d'évaluation, qui n'ont pas d'endpoint de modification).
 */
export function SimpleCrudTable({
  items,
  columns,
  onEdit,
  onToggleActive,
  onRowClick,
  isToggling,
  emptyMessage,
  emptyIcon: EmptyIcon,
}) {
  const hasActions = Boolean(onEdit || onToggleActive)

  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-ink-400">
        {EmptyIcon && <EmptyIcon className="h-8 w-8 mx-auto mb-3 opacity-50" />}
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.label}
              </th>
            ))}
            {hasActions && <th className="px-4 py-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={[
                'border-b border-ink-50 last:border-0 transition-colors',
                onRowClick ? 'cursor-pointer' : '',
                item.actif === false
                  ? 'bg-danger-50/50 hover:bg-danger-50/70'
                  : 'hover:bg-ink-50/60',
              ].join(' ')}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-ink-700">
                  {col.render ? col.render(item) : (item[col.key] ?? '—')}
                </td>
              ))}
              {hasActions && (
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="text-ink-400 hover:text-primary-600 transition-colors"
                        aria-label="Modifier"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {onToggleActive && (
                      <button
                        type="button"
                        onClick={() => onToggleActive(item)}
                        disabled={isToggling?.(item)}
                        className="text-ink-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                        aria-label={item.actif === false ? 'Activer' : 'Désactiver'}
                        title={item.actif === false ? 'Activer' : 'Désactiver'}
                      >
                        {isToggling?.(item) ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
