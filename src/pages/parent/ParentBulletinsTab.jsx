import { useQuery } from '@tanstack/react-query'
import { FileText, GraduationCap } from 'lucide-react'
import { getEnfantBulletins } from '../../api/portailParent'
import { Badge } from '../../components/ui/Badge'
import { BULLETIN_STATUT_LABELS, bulletinStatutBadgeVariant } from '../../config/portailEleveLabels'

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return value
}

export function ParentBulletinsTab({ eleveId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['portail-parent', 'bulletins', eleveId],
    queryFn: () => getEnfantBulletins(eleveId),
    enabled: Boolean(eleveId),
  })
  const bulletins = (Array.isArray(data) ? data : [])
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
          Impossible de charger les bulletins.
        </p>
      )}
      {!isLoading && !isError && bulletins.length === 0 && (
        <div className="p-16 text-center text-ink-400 bg-white rounded-2xl border border-dashed border-ink-200">
          <GraduationCap className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucun bulletin publié pour l'instant.
        </div>
      )}
      {!isLoading && !isError && bulletins.length > 0 && (
        <div className="space-y-2">
          {bulletins.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-ink-100 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-ink-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    Trimestre {b.trimestre?.numero} {b.classe ? `— ${b.classe.nom}` : ''}
                  </p>
                  <p className="text-xs text-ink-400 truncate">
                    Moyenne : {displayValue(b.moyenneGenerale)} · Rang : {displayValue(b.rang)}
                  </p>
                  {b.appreciation && (
                    <p className="text-xs text-ink-500 mt-1">{displayValue(b.appreciation)}</p>
                  )}
                </div>
              </div>
              <Badge variant={bulletinStatutBadgeVariant(b.statut)} className="shrink-0">
                {BULLETIN_STATUT_LABELS[b.statut] ?? b.statut}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
