import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GraduationCap, KeyRound, Mail, MapPin, Phone, User, Users } from 'lucide-react'
import { provisionAccesPortailParent, reinviteAccesPortailParent } from '../../api/parents'
import { Modal } from '../../components/ui/Modal'
import { InfoRow } from '../../components/ui/InfoRow'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PARENT_TYPE_LABELS, STATUT_ELEVE_LABELS, statutEleveBadgeVariant } from '../../config/eleveLabels'

/**
 * Détail d'un parent, ouvert depuis la liste "Parents" de l'établissement.
 * On affiche directement l'objet de la ligne cliquée (forme confirmée en
 * live : voir ParentsTab) plutôt que de refaire un appel à
 * `GET .../parents/{id}` dont la réponse n'est pas confirmée avoir la même
 * forme.
 */
export function ParentDetailModal({ parent, etablissementId, onClose }) {
  const queryClient = useQueryClient()

  const provisionMutation = useMutation({
    mutationFn: () => provisionAccesPortailParent(etablissementId, parent?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parents', 'list'] }),
  })
  const reinviteMutation = useMutation({
    mutationFn: () => reinviteAccesPortailParent(etablissementId, parent?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parents', 'list'] }),
  })

  if (!parent) return null
  const enfants = parent.enfants ?? []
  const hasCompte = Boolean(parent.portail?.linked)

  return (
    <Modal open={Boolean(parent)} onClose={onClose} title="Détail du parent">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
          <User className="h-5 w-5 text-primary-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-bold text-ink-900 truncate">{parent.nomPrenom}</p>
          <p className="text-xs text-ink-400">
            {PARENT_TYPE_LABELS[parent.type] ?? parent.type}
            {parent.lienParente ? ` · ${parent.lienParente}` : ''}
          </p>
        </div>
      </div>

      <div className="mb-2">
        <InfoRow icon={Mail} label="Email" value={parent.email} />
        <InfoRow icon={Phone} label="Téléphone" value={parent.telephone} />
        <InfoRow icon={User} label="Profession" value={parent.profession} />
        <InfoRow icon={MapPin} label="Résidence" value={parent.residence} />
      </div>

      <div className="pt-4 border-t border-ink-100">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm font-medium text-ink-900">Accès portail</p>
          {hasCompte ? (
            <Button
              size="sm"
              variant="secondary"
              isLoading={reinviteMutation.isPending}
              onClick={() => reinviteMutation.mutate()}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Renvoyer l'invitation
            </Button>
          ) : (
            <Button size="sm" variant="secondary" isLoading={provisionMutation.isPending} onClick={() => provisionMutation.mutate()}>
              <KeyRound className="h-3.5 w-3.5" />
              Créer un accès
            </Button>
          )}
        </div>
        <Badge variant={hasCompte ? 'success' : 'neutral'}>{hasCompte ? 'Actif' : 'Aucun'}</Badge>
      </div>

      <div className="pt-4 mt-4 border-t border-ink-100">
        <p className="text-sm font-medium text-ink-900 mb-3">
          Enfant{enfants.length > 1 ? 's' : ''} rattaché{enfants.length > 1 ? 's' : ''}
        </p>
        {enfants.length === 0 ? (
          <p className="text-sm text-ink-400">Aucun enfant rattaché.</p>
        ) : (
          <div className="space-y-2">
            {enfants.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <GraduationCap className="h-4 w-4 text-ink-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {e.prenom} {e.nom}
                    </p>
                    <p className="text-xs text-ink-400">{e.matricule ?? '—'}</p>
                  </div>
                </div>
                {e.statut && (
                  <Badge variant={statutEleveBadgeVariant(e.statut)} className="shrink-0">
                    {STATUT_ELEVE_LABELS[e.statut] ?? e.statut}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
