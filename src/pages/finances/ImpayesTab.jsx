import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { listImpayes } from '../../api/finances'
import { ECHEANCE_STATUT_LABELS, echeanceStatutBadgeVariant } from '../../config/financesLabels'
import { pick } from '../../lib/pick'
import { formatDate } from '../../lib/formatDate'
import { Badge } from '../../components/ui/Badge'

/**
 * `GET .../impayes` — vue de relance des échéances non réglées. Même
 * forme imbriquée que `GET .../echeances` (typeFrais/inscription.eleve),
 * confirmée en live sur ce dernier — on applique le même mapping ici.
 */
export function ImpayesTab({ etablissementId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['finances', 'impayes', etablissementId],
    queryFn: () => listImpayes(etablissementId),
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
      {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les impayés.</p>}
      {!isLoading && !isError && items.length === 0 && (
        <div className="p-16 text-center text-ink-400">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucun impayé pour l'instant.
        </div>
      )}
      {!isLoading && !isError && items.length > 0 && (
        <div className="divide-y divide-ink-50">
          {items.map((it, index) => {
            const id = pick(it, ['id'], index)
            const statut = pick(it, ['statut'], null)
            const libelle = it.typeFrais?.libelle ?? 'Échéance'
            const eleve = it.inscription?.eleve
            const eleveNom = eleve ? `${eleve.prenom ?? ''} ${eleve.nom ?? ''}`.trim() : null
            const montant = pick(it, ['montantRestant', 'montantNet'])
            return (
              <div key={id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {libelle}
                    {eleveNom ? ` — ${eleveNom}` : ''}
                  </p>
                  <p className="text-xs text-ink-400">
                    {montant} GNF restant · échéance {formatDate(pick(it, ['echeanceDate'], null)) ?? '—'}
                  </p>
                </div>
                <Badge variant={echeanceStatutBadgeVariant(statut)}>{ECHEANCE_STATUT_LABELS[statut] ?? statut ?? 'À payer'}</Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
