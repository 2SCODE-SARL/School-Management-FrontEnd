import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Inbox, Plus } from 'lucide-react'
import { createDemande, getMesEnfants, listMesDemandes } from '../../api/portailParent'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { DEMANDE_STATUT_LABELS, demandeStatutBadgeVariant } from '../../config/demandesLabels'
import { formatDate } from '../../lib/formatDate'
import { DemandeForm } from './DemandeForm'

export default function DemandesPage() {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: enfantsData } = useQuery({
    queryKey: ['portail-parent', 'mes-enfants'],
    queryFn: getMesEnfants,
  })
  const enfants = (Array.isArray(enfantsData) ? enfantsData : (enfantsData?.items ?? [])).map((item) => item.eleve ?? item)
  const enfantOptions = enfants.map((e) => ({ value: e.id, label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() }))
  const etablissementIdByEleve = Object.fromEntries(enfants.map((e) => [e.id, e.etablissementId]))

  const demandesQueryKey = ['portail-parent', 'mes-demandes']
  const { data, isLoading, isError } = useQuery({
    queryKey: demandesQueryKey,
    queryFn: listMesDemandes,
  })
  const demandes = (Array.isArray(data) ? data : (data?.items ?? []))
    .slice()
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const createMutation = useMutation({
    mutationFn: (payload) =>
      createDemande({ ...payload, etablissementId: etablissementIdByEleve[payload.eleveId] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandesQueryKey })
      setCreateOpen(false)
    },
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink-900">Mes demandes</h1>
        <Button onClick={() => setCreateOpen(true)} disabled={enfantOptions.length === 0}>
          <Plus className="h-4 w-4" />
          Nouvelle demande
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger tes demandes.</p>}
        {!isLoading && !isError && demandes.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <Inbox className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucune demande envoyée pour l'instant.
          </div>
        )}
        {!isLoading && !isError && demandes.length > 0 && (
          <div className="divide-y divide-ink-50">
            {demandes.map((d) => (
              <div key={d.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-medium text-ink-900">{d.sujet}</p>
                  <Badge variant={demandeStatutBadgeVariant(d.statut)} className="shrink-0">
                    {DEMANDE_STATUT_LABELS[d.statut] ?? d.statut}
                  </Badge>
                </div>
                <p className="text-sm text-ink-600 mb-1">{d.description}</p>
                <p className="text-xs text-ink-400">{formatDate(d.createdAt)}</p>
                {d.reponse && (
                  <div className="mt-2 rounded-lg bg-ink-50 px-3 py-2">
                    <p className="text-xs font-medium text-ink-500 mb-0.5">Réponse</p>
                    <p className="text-sm text-ink-700">{d.reponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Nouvelle demande">
        <DemandeForm
          enfantOptions={enfantOptions}
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>
    </div>
  )
}
