import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { getMesEnfants } from '../../api/portailParent'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { STATUT_ELEVE_LABELS, statutEleveBadgeVariant } from '../../config/eleveLabels'
import { DemandesRattachement } from './DemandesRattachement'

/**
 * `GET .../mes-enfants` n'est pas typé dans la doc — on part du principe
 * qu'un item peut être soit l'élève à plat, soit imbriqué sous `.eleve`
 * (même motif que `parents[].parent` côté fiche élève), à ajuster une fois
 * testé en live.
 */
export default function ParentDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['portail-parent', 'mes-enfants'],
    queryFn: getMesEnfants,
  })
  const enfants = (Array.isArray(data) ? data : (data?.items ?? [])).map((item) => item.eleve ?? item)

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">Mes enfants</h1>

      <DemandesRattachement />

      {isLoading && (
        <div className="p-16 flex justify-center bg-white rounded-2xl border border-ink-100">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}
      {isError && (
        <p className="p-8 text-center text-sm text-danger-600 bg-white rounded-2xl border border-ink-100">
          Impossible de charger tes enfants.
        </p>
      )}
      {!isLoading && !isError && enfants.length === 0 && (
        <div className="p-16 text-center text-ink-400 bg-white rounded-2xl border border-dashed border-ink-200">
          <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucun enfant rattaché à ton compte pour l'instant.
        </div>
      )}
      {!isLoading && !isError && enfants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enfants.map((e, i) => (
            <div key={e.id ?? i} className="bg-white rounded-2xl border border-ink-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={`${e.prenom ?? ''} ${e.nom ?? ''}`} src={e.photoUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-900 truncate">
                    {e.prenom} {e.nom}
                  </p>
                  <p className="text-xs text-ink-400">{e.matricule}</p>
                </div>
              </div>
              {e.statut && (
                <Badge variant={statutEleveBadgeVariant(e.statut)}>
                  {STATUT_ELEVE_LABELS[e.statut] ?? e.statut}
                </Badge>
              )}
              {e.classe?.nom && <p className="text-sm text-ink-500 mt-2">{e.classe.nom}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
