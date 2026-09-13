import { useQuery } from '@tanstack/react-query'
import { LogIn } from 'lucide-react'
import { getEnfantAcces } from '../../api/portailParent'
import { Badge } from '../../components/ui/Badge'
import { ACCES_TYPE_LABELS } from '../../config/presencesLabels'
import { formatDateTime } from '../../lib/formatDate'

/** Entrées/sorties de l'établissement (badge) — même DTO probable que côté staff (api/presences.js). */
export function ParentAccesTab({ eleveId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['portail-parent', 'acces', eleveId],
    queryFn: () => getEnfantAcces(eleveId),
    enabled: Boolean(eleveId),
  })
  const acces = (Array.isArray(data) ? data : [])
    .slice()
    .sort((a, b) => (b.createdAt ?? b.dateHeure ?? '').localeCompare(a.createdAt ?? a.dateHeure ?? ''))

  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
      {isLoading && (
        <div className="p-12 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}
      {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les passages.</p>}
      {!isLoading && !isError && acces.length === 0 && (
        <div className="p-16 text-center text-ink-400">
          <LogIn className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucun passage enregistré pour l'instant.
        </div>
      )}
      {!isLoading && !isError && acces.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Heure</th>
              </tr>
            </thead>
            <tbody>
              {acces.map((a, i) => (
                <tr key={a.id ?? i} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3">
                    <Badge variant={a.type === 'ENTREE' ? 'success' : 'neutral'}>
                      {ACCES_TYPE_LABELS[a.type] ?? a.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{formatDateTime(a.createdAt ?? a.dateHeure) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
