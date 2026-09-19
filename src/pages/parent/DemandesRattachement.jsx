import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import {
  accepterRattachement,
  getDemandeRattachement,
  listDemandesRattachement,
  refuserRattachement,
} from '../../api/portailParent'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { pick } from '../../lib/pick'
import { formatDate } from '../../lib/formatDate'

/**
 * Bandeau "Demandes de rattachement" affiché en tête du tableau de bord
 * Parent : un établissement demande à ce Parent d'approuver qu'un élève
 * chez eux est bien son enfant, avant de l'ajouter à sa liste d'enfants.
 * Endpoints ajoutés récemment par le backend, réponses non typées dans la
 * doc (`ApiSuccessResponse` générique) — noms de champs devinés via `pick`,
 * à ajuster une fois testés en live.
 */
export function DemandesRattachement() {
  const [openId, setOpenId] = useState(null)
  const queryClient = useQueryClient()

  const listQueryKey = ['portail-parent', 'demandes-rattachement']
  const { data } = useQuery({ queryKey: listQueryKey, queryFn: listDemandesRattachement })
  const demandes = Array.isArray(data) ? data : (data?.items ?? [])
  // On n'affiche que celles encore en attente — si le backend renvoie aussi
  // les demandes déjà traitées, on les masque via un éventuel champ de
  // statut (nom non confirmé, on reste permissif si absent).
  const pending = demandes.filter((d) => {
    const statut = pick(d, ['statut', 'etat'], null)
    return !statut || /ATTENTE|PENDING|EN_COURS/i.test(statut)
  })

  const detailQuery = useQuery({
    queryKey: ['portail-parent', 'demande-rattachement', openId],
    queryFn: () => getDemandeRattachement(openId),
    enabled: Boolean(openId),
  })
  const detail = detailQuery.data
  const eleve = detail?.eleve ?? detail

  function close() {
    setOpenId(null)
  }

  const acceptMutation = useMutation({
    mutationFn: () => accepterRattachement(openId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey })
      queryClient.invalidateQueries({ queryKey: ['portail-parent', 'mes-enfants'] })
      close()
    },
  })
  const refuseMutation = useMutation({
    mutationFn: () => refuserRattachement(openId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey })
      close()
    },
  })

  if (pending.length === 0) return null

  return (
    <>
      <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-4 w-4 text-primary-600" />
          <p className="text-sm font-semibold text-primary-900">
            {pending.length > 1
              ? `${pending.length} demandes de rattachement en attente`
              : 'Une demande de rattachement en attente'}
          </p>
        </div>
        <div className="space-y-2">
          {pending.map((d) => {
            const id = pick(d, ['id', 'demandeId'])
            const eleveNom =
              pick(d, ['eleveNomPrenom'], null) ??
              `${pick(d, ['elevePrenom'], '')} ${pick(d, ['eleveNom'], '')}`.trim()
            const etabNom = pick(d, ['etablissementNom', 'nomEtablissement'], null)
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 border border-primary-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {eleveNom || 'Un élève'} {etabNom ? `— ${etabNom}` : ''}
                  </p>
                  <p className="text-xs text-ink-400">
                    Confirme que c'est bien ton enfant. Il n'apparaîtra dans « Mes enfants » qu'une fois son
                    inscription finalisée par l'établissement (statut « Inscrit »).
                  </p>
                </div>
                <Button size="sm" onClick={() => setOpenId(id)} className="shrink-0">
                  Voir & décider
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <Modal open={Boolean(openId)} onClose={close} title="Confirmer le rattachement">
        {detailQuery.isLoading && (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {detailQuery.isError && (
          <ApiErrorMessage error={detailQuery.error} fallback="Impossible de charger cette demande." className="text-sm text-danger-600 text-center py-8" />
        )}
        {detail && (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">
              Un établissement affirme que l'élève ci-dessous est ton enfant. Vérifie ses informations avant de
              confirmer — cette action donnera à cet établissement accès à son suivi scolaire depuis ton compte.
              Une fois confirmé, il n'apparaîtra dans « Mes enfants » qu'une fois son inscription finalisée par
              l'établissement (statut « Inscrit ») — pas d'inquiétude si ça n'est pas immédiat.
            </p>
            <div className="rounded-lg border border-ink-100 p-4 space-y-1">
              <p className="font-medium text-ink-900">
                {pick(eleve, ['prenom'], '')} {pick(eleve, ['nom'], '')}
              </p>
              <p className="text-sm text-ink-500">Matricule : {pick(eleve, ['matricule'])}</p>
              <p className="text-sm text-ink-500">
                Date de naissance : {formatDate(pick(eleve, ['dateNaissance'], null)) ?? '—'}
              </p>
              <p className="text-sm text-ink-500">
                Établissement : {pick(eleve, ['etablissementNom', 'nomEtablissement'])}
              </p>
            </div>
            {(acceptMutation.isError || refuseMutation.isError) && (
              <Alert variant="danger">Une erreur est survenue, réessaie.</Alert>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="!text-danger-600"
                isLoading={refuseMutation.isPending}
                onClick={() => refuseMutation.mutate()}
              >
                Ce n'est pas mon enfant
              </Button>
              <Button type="button" isLoading={acceptMutation.isPending} onClick={() => acceptMutation.mutate()}>
                Confirmer, c'est mon enfant
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
