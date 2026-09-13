import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Inbox, Send } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { cloturerDemande, listDemandes, repondreDemande } from '../../api/demandes'
import { searchEtablissements } from '../../api/etablissements'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Combobox } from '../../components/ui/Combobox'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DEMANDE_STATUT_LABELS, DEMANDE_STATUT_OPTIONS, demandeStatutBadgeVariant } from '../../config/demandesLabels'
import { formatDate } from '../../lib/formatDate'

/** Demandes envoyées par les parents (certificat, correction de note, congé...) — à traiter. */
export default function DemandesPage() {
  const { user } = useAuth()
  const isAdmin = getPrimaryRole(user) === 'ADMINISTRATEUR'
  const [selectedEtabId, setSelectedEtabId] = useState(isAdmin ? '' : (user?.etablissementId ?? ''))
  const [statutFilter, setStatutFilter] = useState('')
  const [respondingDemande, setRespondingDemande] = useState(null)
  const [reponse, setReponse] = useState('')
  const [cloturingDemande, setCloturingDemande] = useState(null)
  const queryClient = useQueryClient()

  const { data: etablissementsData } = useQuery({
    queryKey: ['etablissements', 'options'],
    queryFn: () => searchEtablissements({ limit: 100 }),
    enabled: isAdmin,
  })
  const etablissementOptions = (etablissementsData?.items ?? []).map((e) => ({ value: e.id, label: e.nom }))

  const queryKey = ['demandes', selectedEtabId, statutFilter]
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listDemandes(selectedEtabId, statutFilter),
    enabled: Boolean(selectedEtabId),
  })
  const demandes = (Array.isArray(data) ? data : (data?.items ?? []))
    .slice()
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey })
  }

  const repondreMutation = useMutation({
    mutationFn: () => repondreDemande(selectedEtabId, respondingDemande.id, reponse),
    onSuccess: () => {
      invalidateAll()
      setRespondingDemande(null)
      setReponse('')
    },
  })

  const cloturerMutation = useMutation({
    mutationFn: () => cloturerDemande(selectedEtabId, cloturingDemande.id),
    onSuccess: () => {
      invalidateAll()
      setCloturingDemande(null)
    },
  })

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Demandes</h1>
      <p className="text-sm text-ink-500 mb-6">Demandes envoyées par les parents (certificat, correction, congé...).</p>

      <div className="flex flex-wrap gap-3 mb-6">
        {isAdmin && (
          <div className="max-w-sm w-full">
            <Combobox
              id="etablissement-select"
              label="Établissement"
              options={etablissementOptions}
              value={selectedEtabId}
              onChange={setSelectedEtabId}
              placeholder="Sélectionner un établissement..."
              searchPlaceholder="Rechercher une école..."
            />
          </div>
        )}
        <div className="max-w-xs w-full">
          <Select
            id="statut-filter"
            label="Statut"
            options={[{ value: '', label: 'Tous' }, ...DEMANDE_STATUT_OPTIONS]}
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
          />
        </div>
      </div>

      {!selectedEtabId ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
          Sélectionne un établissement pour voir ses demandes.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
          {isLoading && (
            <div className="p-12 flex justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
            </div>
          )}
          {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les demandes.</p>}
          {!isLoading && !isError && demandes.length === 0 && (
            <div className="p-16 text-center text-ink-400">
              <Inbox className="h-8 w-8 mx-auto mb-3 opacity-50" />
              Aucune demande pour l'instant.
            </div>
          )}
          {!isLoading && !isError && demandes.length > 0 && (
            <div className="divide-y divide-ink-50">
              {demandes.map((d) => {
                const dejaClos = d.statut === 'CLOTUREE'
                return (
                  <div key={d.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-sm font-medium text-ink-900">{d.sujet}</p>
                      <Badge variant={demandeStatutBadgeVariant(d.statut)} className="shrink-0">
                        {DEMANDE_STATUT_LABELS[d.statut] ?? d.statut}
                      </Badge>
                    </div>
                    <p className="text-sm text-ink-600 mb-1">{d.description}</p>
                    <p className="text-xs text-ink-400 mb-2">
                      {d.eleve ? `${d.eleve.prenom ?? ''} ${d.eleve.nom ?? ''}`.trim() + ' · ' : ''}
                      {formatDate(d.createdAt)}
                    </p>
                    {d.reponse && (
                      <div className="rounded-lg bg-ink-50 px-3 py-2 mb-2">
                        <p className="text-xs font-medium text-ink-500 mb-0.5">Réponse</p>
                        <p className="text-sm text-ink-700">{d.reponse}</p>
                      </div>
                    )}
                    {!dejaClos && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setRespondingDemande(d)}>
                          <Send className="h-3.5 w-3.5" />
                          Répondre
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setCloturingDemande(d)}>
                          Clôturer
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <Modal
        open={Boolean(respondingDemande)}
        onClose={() => {
          setRespondingDemande(null)
          setReponse('')
        }}
        title="Répondre à la demande"
        maxWidth="max-w-md"
      >
        {respondingDemande && (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">{respondingDemande.sujet}</p>
            <textarea
              rows={4}
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              placeholder="Ta réponse..."
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setRespondingDemande(null)
                  setReponse('')
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={!reponse.trim()}
                isLoading={repondreMutation.isPending}
                onClick={() => repondreMutation.mutate()}
              >
                Envoyer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(cloturingDemande)}
        onClose={() => setCloturingDemande(null)}
        onConfirm={() => cloturerMutation.mutate()}
        isLoading={cloturerMutation.isPending}
        title="Clôturer cette demande ?"
        description="Le parent ne pourra plus la voir évoluer — à faire une fois traitée."
        confirmLabel="Clôturer"
      />
    </div>
  )
}
