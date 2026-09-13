import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Pagination simple précédent/suivant + "Page x sur y". */
export function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-1 pt-4">
      <p className="text-xs text-ink-500">
        {total} résultat{total > 1 ? 's' : ''} — page {page} sur {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
