import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Users } from 'lucide-react'
import { listParentsEtablissement } from '../../api/parents'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { TruncatedText } from '../../components/ui/TruncatedText'
import { PARENT_TYPE_LABELS } from '../../config/eleveLabels'
import { pick } from '../../lib/pick'
import { ParentDetailModal } from './ParentDetailModal'

/**
 * Liste des parents rattachés à l'établissement — endpoint ajouté par le
 * backend suite à notre remontée ("pas d'endpoint pour lister tous les
 * parents"). Réponse confirmée en live : `{ id, type, nomPrenom,
 * profession, telephone, email, residence, lienParente, portail: {
 * linked }, enfants: [{ id, matricule, nom, prenom, statut,
 * statutAccesPortail }] }`. Un parent y apparaît une fois qu'il est
 * effectivement rattaché à au moins un élève de cet établissement — via
 * création directe, rattachement fratrie, ou acceptation d'une demande de
 * rattachement plateforme.
 */
export function ParentsTab({ etablissementId }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewingParent, setViewingParent] = useState(null)
  const debouncedSearch = useDebouncedValue(search)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['parents', 'list', etablissementId, { q: debouncedSearch, page }],
    queryFn: () => listParentsEtablissement(etablissementId, { q: debouncedSearch || undefined, page }),
    enabled: Boolean(etablissementId),
    placeholderData: (previous) => previous,
  })

  const items = Array.isArray(data) ? data : (data?.items ?? [])
  // Garde le détail à jour après une action (créer/renvoyer l'accès) sans
  // devoir refermer/rouvrir la modale — retombe sur l'instantané du clic
  // tant que la liste n'a pas fini de se rafraîchir.
  const viewingParentFresh = viewingParent
    ? (items.find((x) => x.id === viewingParent.id) ?? viewingParent)
    : null

  return (
    <div>
      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        <div className="p-4 border-b border-ink-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Rechercher un parent par nom..."
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
            />
          </div>
        </div>

        {isLoading && (
          <div className="p-16 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && (
          <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les parents.</p>
        )}
        {!isLoading && !isError && items.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun parent rattaché pour l'instant.
          </div>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Parent</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Enfant(s)</th>
                  <th className="px-4 py-3 font-medium">Accès portail</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, index) => {
                  const id = pick(p, ['id'], index)
                  const type = pick(p, ['type'], null)
                  const email = pick(p, ['email'], null)
                  const telephone = pick(p, ['telephone'], null)
                  // Confirmé en live : `portail: { linked: boolean }` — pas
                  // `utilisateurId` comme sur la fiche élève (deviné à tort).
                  const hasCompte = Boolean(p.portail?.linked)
                  const enfants = pick(p, ['enfants', 'eleves'], [])
                  const nbEnfants = Array.isArray(enfants) ? enfants.length : pick(p, ['nombreEnfants'], null)
                  return (
                    <tr
                      key={id}
                      onClick={() => setViewingParent(p)}
                      className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {/* `photoUrl` n'existe pas dans la forme confirmée en
                              live (voir doc en tête de fichier) — lu quand
                              même défensivement, signalé au backend comme
                              lacune (aucune photo consultable pour un
                              Parent) : s'affichera automatiquement le jour où
                              le champ existera, initiales en attendant. */}
                          <Avatar name={pick(p, ['nomPrenom'], 'Parent')} src={pick(p, ['photoUrl'], null)} size={32} />
                          <TruncatedText
                            text={pick(p, ['nomPrenom'], 'Parent')}
                            maxWidth={180}
                            className="font-medium text-ink-900"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{PARENT_TYPE_LABELS[type] ?? type ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-600">
                        <TruncatedText text={[email, telephone].filter(Boolean).join(' · ') || null} maxWidth={220} />
                      </td>
                      <td className="px-4 py-3 text-ink-600">{nbEnfants ?? '—'}</td>
                      <td className="px-4 py-3">
                        {hasCompte ? (
                          <Badge variant="success">Actif</Badge>
                        ) : (
                          <Badge variant="neutral">Aucun</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && !Array.isArray(data) && (
          <div className="px-4 pb-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ParentDetailModal
        parent={viewingParentFresh}
        etablissementId={etablissementId}
        onClose={() => setViewingParent(null)}
      />
    </div>
  )
}
