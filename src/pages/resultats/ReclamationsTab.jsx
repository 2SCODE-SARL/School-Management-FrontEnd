import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Send } from 'lucide-react'
import { listReclamations, repondreReclamation } from '../../api/resultats'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { RECLAMATION_STATUT_LABELS, RECLAMATION_STATUT_OPTIONS, reclamationStatutBadgeVariant } from '../../config/resultatsLabels'

const REPONSE_STATUT_OPTIONS = [
  { value: 'EN_REVISION', label: 'Mettre en révision' },
  { value: 'ACCEPTEE', label: 'Accepter' },
  { value: 'REFUSEE', label: 'Refuser' },
]

function RepondreForm({ reclamation, onCancel, onSubmit, isSubmitting }) {
  const [statut, setStatut] = useState('EN_REVISION')
  const [reponseProf, setReponseProf] = useState('')
  const [nouvelleValeur, setNouvelleValeur] = useState('')
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!reponseProf.trim()) {
      setFormError('La réponse est requise.')
      return
    }
    const payload = { statut, reponseProf }
    if (statut === 'ACCEPTEE' && nouvelleValeur !== '') payload.nouvelleValeur = Number(nouvelleValeur)

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-ink-600">
        Motif : <span className="font-medium text-ink-900">{reclamation.motif}</span>
      </p>
      {reclamation.detail && <p className="text-sm text-ink-500">{reclamation.detail}</p>}

      <Select id="statut" label="Décision" options={REPONSE_STATUT_OPTIONS} value={statut} onChange={(e) => setStatut(e.target.value)} required />
      {statut === 'ACCEPTEE' && (
        <TextField
          id="nouvelleValeur"
          label="Nouvelle note (optionnel)"
          type="number"
          value={nouvelleValeur}
          onChange={(e) => setNouvelleValeur(e.target.value)}
          placeholder="15"
        />
      )}
      <div>
        <label htmlFor="reponseProf" className="block text-sm font-medium text-ink-700 mb-1.5">
          Réponse<span className="text-danger-500"> *</span>
        </label>
        <textarea
          id="reponseProf"
          rows={3}
          value={reponseProf}
          onChange={(e) => setReponseProf(e.target.value)}
          placeholder="Note vérifiée et corrigée..."
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
        />
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <Send className="h-3.5 w-3.5" />
          Envoyer
        </Button>
      </div>
    </form>
  )
}

/**
 * Contestations de notes déposées par les élèves — refonte backend suite
 * à notre remontée -7 : `GET .../reclamations` ne renvoie plus que les
 * réclamations affectées à l'Enseignant connecté (Admin/Directeur n'y ont
 * plus accès du tout, ce n'est plus juste "répondre sans liste").
 */
export function ReclamationsTab({ etablissementId }) {
  const [statutFilter, setStatutFilter] = useState('')
  const [respondingReclamation, setRespondingReclamation] = useState(null)
  const queryClient = useQueryClient()

  const queryKey = ['resultats', 'reclamations', etablissementId, statutFilter]
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listReclamations(etablissementId, statutFilter),
    enabled: Boolean(etablissementId),
  })
  const reclamations = (Array.isArray(data) ? data : (data?.items ?? []))
    .slice()
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const repondreMutation = useMutation({
    mutationFn: (payload) => repondreReclamation(etablissementId, respondingReclamation.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setRespondingReclamation(null)
    },
  })

  return (
    <div>
      <div className="max-w-xs mb-4">
        <Select
          id="statut-filter"
          label="Statut"
          options={[{ value: '', label: 'Tous' }, ...RECLAMATION_STATUT_OPTIONS]}
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les réclamations.</p>}
        {!isLoading && !isError && reclamations.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucune réclamation pour l'instant.
          </div>
        )}
        {!isLoading && !isError && reclamations.length > 0 && (
          <div className="divide-y divide-ink-50">
            {reclamations.map((r) => {
              const dejaTraitee = r.statut === 'ACCEPTEE' || r.statut === 'REFUSEE'
              return (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-sm font-medium text-ink-900">{r.motif}</p>
                    <Badge variant={reclamationStatutBadgeVariant(r.statut)} className="shrink-0">
                      {RECLAMATION_STATUT_LABELS[r.statut] ?? r.statut}
                    </Badge>
                  </div>
                  {r.detail && <p className="text-sm text-ink-600 mb-1">{r.detail}</p>}
                  {r.reponseProf && (
                    <div className="mt-2 rounded-lg bg-ink-50 px-3 py-2">
                      <p className="text-xs font-medium text-ink-500 mb-0.5">Réponse</p>
                      <p className="text-sm text-ink-700">{r.reponseProf}</p>
                    </div>
                  )}
                  {!dejaTraitee && (
                    <div className="flex justify-end mt-2">
                      <Button size="sm" variant="secondary" onClick={() => setRespondingReclamation(r)}>
                        <Send className="h-3.5 w-3.5" />
                        Répondre
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(respondingReclamation)}
        onClose={() => setRespondingReclamation(null)}
        title="Répondre à la réclamation"
        maxWidth="max-w-md"
      >
        {respondingReclamation && (
          <RepondreForm
            reclamation={respondingReclamation}
            isSubmitting={repondreMutation.isPending}
            onCancel={() => setRespondingReclamation(null)}
            onSubmit={(payload) => repondreMutation.mutateAsync(payload)}
          />
        )}
      </Modal>
    </div>
  )
}
