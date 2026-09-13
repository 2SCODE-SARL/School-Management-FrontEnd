import { useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { listEncaissements } from '../../api/finances'
import { MODE_PAIEMENT_LABELS } from '../../config/financesLabels'
import { pick } from '../../lib/pick'
import { formatDateTime } from '../../lib/formatDate'

/**
 * `GET .../encaissements` — sans pagination documentée, historique des
 * paiements reçus. Champ de date confirmé en live (via `paiements[]`
 * imbriqué sous une échéance) : `datePaiement`, pas `createdAt`.
 */
export function EncaissementsTab({ etablissementId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['finances', 'encaissements', etablissementId],
    queryFn: () => listEncaissements(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const items = Array.isArray(data) ? data : (data?.items ?? [])

  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
      {isLoading && (
        <div className="p-16 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}
      {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les encaissements.</p>}
      {!isLoading && !isError && items.length === 0 && (
        <div className="p-16 text-center text-ink-400">
          <Receipt className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucun encaissement pour l'instant.
        </div>
      )}
      {!isLoading && !isError && items.length > 0 && (
        <div className="divide-y divide-ink-50">
          {items.map((it, index) => {
            const mode = pick(it, ['mode'], null)
            return (
              <div key={pick(it, ['id'], index)} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{pick(it, ['reference'], 'Encaissement')}</p>
                  <p className="text-xs text-ink-400">{MODE_PAIEMENT_LABELS[mode] ?? mode ?? '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-ink-900">{pick(it, ['montant'])} GNF</p>
                  <p className="text-xs text-ink-400">{formatDateTime(pick(it, ['datePaiement', 'createdAt'], null)) ?? '—'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
