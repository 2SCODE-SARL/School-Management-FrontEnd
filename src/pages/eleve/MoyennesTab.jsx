import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { getResultats } from '../../api/portailEleve'
import { Badge } from '../../components/ui/Badge'
import { DECISION_LABELS, decisionBadgeVariant } from '../../config/portailEleveLabels'

export function MoyennesTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['portail-eleve', 'resultats'],
    queryFn: getResultats,
  })
  const resultats = (Array.isArray(data) ? data : [])
    .slice()
    .sort((a, b) => (b.trimestre?.numero ?? 0) - (a.trimestre?.numero ?? 0))

  return (
    <div>
      {isLoading && (
        <div className="p-12 flex justify-center bg-white rounded-2xl border border-ink-100">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}
      {isError && (
        <p className="p-8 text-center text-sm text-danger-600 bg-white rounded-2xl border border-ink-100">
          Impossible de charger tes résultats.
        </p>
      )}
      {!isLoading && !isError && resultats.length === 0 && (
        <div className="p-16 text-center text-ink-400 bg-white rounded-2xl border border-dashed border-ink-200">
          <TrendingUp className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucun résultat de trimestre publié pour l'instant.
        </div>
      )}
      {!isLoading && !isError && resultats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resultats.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-ink-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-ink-900">Trimestre {r.trimestre?.numero}</p>
                {r.decision && (
                  <Badge variant={decisionBadgeVariant(r.decision)}>
                    {DECISION_LABELS[r.decision] ?? r.decision}
                  </Badge>
                )}
              </div>
              <p className="text-3xl font-heading font-bold text-ink-900">{r.moyenneGenerale}/20</p>
              <p className="text-sm text-ink-500 mt-1">
                Rang {r.rang}
                {r.mention ? ` · ${r.mention}` : ''}
              </p>
              <p className="text-xs text-ink-400 mt-2">{r.classe?.nom}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
