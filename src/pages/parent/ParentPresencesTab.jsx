import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck } from 'lucide-react'
import { getEnfantPresences } from '../../api/portailParent'
import { Badge } from '../../components/ui/Badge'
import { ELEVE_PRESENCE_STATUT_LABELS, elevePresenceStatutBadgeVariant } from '../../config/portailEleveLabels'
import { formatDate } from '../../lib/formatDate'

export function ParentPresencesTab({ eleveId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['portail-parent', 'presences', eleveId],
    queryFn: () => getEnfantPresences(eleveId),
    enabled: Boolean(eleveId),
  })
  const presences = (Array.isArray(data) ? data : [])
    .slice()
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
      {isLoading && (
        <div className="p-12 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}
      {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les présences.</p>}
      {!isLoading && !isError && presences.length === 0 && (
        <div className="p-16 text-center text-ink-400">
          <ClipboardCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucune présence enregistrée pour l'instant.
        </div>
      )}
      {!isLoading && !isError && presences.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Cours</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {presences.map((p) => (
                <tr key={p.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 text-ink-600">
                    {p.cours?.matiere?.intitule ?? '—'}
                    {p.cours?.heureDebut && <span className="text-ink-400"> · {p.cours.heureDebut}–{p.cours.heureFin}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={elevePresenceStatutBadgeVariant(p.statut)}>
                      {ELEVE_PRESENCE_STATUT_LABELS[p.statut] ?? p.statut}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
