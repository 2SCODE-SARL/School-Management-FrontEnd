import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ClipboardCheck, X } from 'lucide-react'
import { listComptesEnAttente, refuserCompteEmploye, validerCompteEmploye } from '../../api/rh'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Alert } from '../../components/ui/Alert'
import { COMPTE_EMPLOYE_ROLE_LABELS } from '../../config/rhLabels'
import { formatDateTime } from '../../lib/formatDate'
import { pick } from '../../lib/pick'
import { ApiError } from '../../api/client'

/** Petit formulaire (motif optionnel) pour refuser une demande de compte. */
function RefuserForm({ onCancel, onSubmit, isSubmitting }) {
  const [motif, setMotif] = useState('')
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      await onSubmit(motif || undefined)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="motif" className="block text-sm font-medium text-ink-700 mb-1.5">
          Motif du refus (optionnel)
        </label>
        <textarea
          id="motif"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Transmis au dossier de validation..."
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors resize-none"
        />
      </div>
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="danger" isLoading={isSubmitting}>
          Refuser la demande
        </Button>
      </div>
    </form>
  )
}

/**
 * Comptes provisionnés par un Secrétaire, en attente de validation par le
 * Directeur/Admin avant de devenir actifs.
 */
export function ComptesEnAttenteTab({ etablissementId, canManageComptes }) {
  const [refusingId, setRefusingId] = useState(null)
  const [validatingId, setValidatingId] = useState(null)
  const queryClient = useQueryClient()

  const queryKey = ['rh', 'comptes-en-attente', etablissementId]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listComptesEnAttente(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const comptes = Array.isArray(data) ? data : (data?.items ?? [])

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['rh', 'employes', etablissementId] })
  }

  const validerMutation = useMutation({
    mutationFn: (utilisateurId) => validerCompteEmploye(etablissementId, utilisateurId),
    onSuccess: () => {
      invalidateAll()
      setValidatingId(null)
    },
  })

  const refuserMutation = useMutation({
    mutationFn: ({ utilisateurId, motif }) => refuserCompteEmploye(etablissementId, utilisateurId, motif),
    onSuccess: () => {
      invalidateAll()
      setRefusingId(null)
    },
  })

  return (
    <div>
      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les comptes en attente." />}
        {!isLoading && !isError && comptes.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <ClipboardCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun compte en attente de validation.
          </div>
        )}
        {!isLoading && !isError && comptes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Rôle demandé</th>
                  <th className="px-4 py-3 font-medium">Demandé le</th>
                  {canManageComptes && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {comptes.map((item, index) => {
                  const id = item.utilisateurId ?? item.id
                  const employe = item.employe ?? {}
                  const nom = `${item.prenom ?? employe.prenom ?? ''} ${item.nom ?? employe.nom ?? ''}`.trim()
                  const roleCode = pick(item, ['roleCode', 'role'])
                  return (
                    <tr key={id ?? index} className="border-b border-ink-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink-900">{nom || '—'}</td>
                      <td className="px-4 py-3 text-ink-600">{item.email ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-600">
                        {COMPTE_EMPLOYE_ROLE_LABELS[roleCode] ?? roleCode}
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {formatDateTime(item.createdAt ?? item.dateCreation)}
                      </td>
                      {canManageComptes && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setRefusingId(id)}>
                              <X className="h-3.5 w-3.5" />
                              Refuser
                            </Button>
                            <Button size="sm" onClick={() => setValidatingId(id)}>
                              <Check className="h-3.5 w-3.5" />
                              Valider
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(validatingId)}
        onClose={() => setValidatingId(null)}
        onConfirm={() => validerMutation.mutate(validatingId)}
        isLoading={validerMutation.isPending}
        variant="primary"
        title="Valider ce compte ?"
        description="Le compte sera activé et la personne pourra se connecter."
        confirmLabel="Valider"
      />

      <Modal open={Boolean(refusingId)} onClose={() => setRefusingId(null)} title="Refuser cette demande de compte" maxWidth="max-w-sm">
        <RefuserForm
          isSubmitting={refuserMutation.isPending}
          onCancel={() => setRefusingId(null)}
          onSubmit={(motif) => refuserMutation.mutateAsync({ utilisateurId: refusingId, motif })}
        />
      </Modal>
    </div>
  )
}
