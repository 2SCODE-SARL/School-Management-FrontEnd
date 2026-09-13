import { useQuery } from '@tanstack/react-query'
import { FileEdit } from 'lucide-react'
import { getEnfantNotes } from '../../api/portailParent'
import { formatDate } from '../../lib/formatDate'

/**
 * Contester une note se fait maintenant depuis le compte de l'ÉLÈVE
 * lui-même (refonte backend suite à notre remontée -7) : l'ancien
 * mécanisme où le Parent contestait directement a été retiré côté API
 * (`demanderCorrection` renvoie 404). Le Parent reste ici en lecture
 * seule sur les notes.
 */
export function ParentNotesTab({ eleveId }) {
  const queryKey = ['portail-parent', 'notes', eleveId]
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getEnfantNotes(eleveId),
    enabled: Boolean(eleveId),
  })
  const notes = (Array.isArray(data) ? data : [])
    .slice()
    .sort((a, b) => (b.examen?.date ?? '').localeCompare(a.examen?.date ?? ''))

  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
      {isLoading && (
        <div className="p-12 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}
      {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les notes.</p>}
      {!isLoading && !isError && notes.length === 0 && (
        <div className="p-16 text-center text-ink-400">
          <FileEdit className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucune note publiée pour l'instant.
        </div>
      )}
      {!isLoading && !isError && notes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                <th className="px-4 py-3 font-medium">Examen</th>
                <th className="px-4 py-3 font-medium">Matière</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">{n.examen?.intitule}</td>
                  <td className="px-4 py-3 text-ink-600">{n.examen?.matiere?.intitule}</td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(n.examen?.date)}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">
                    {n.valeur}/{n.bareme === 'SUR_10' ? '10' : '20'}
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
