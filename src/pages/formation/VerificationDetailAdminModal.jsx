import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import {
  approveProviderVerification,
  getProviderVerificationAdmin,
  getProviderVerificationDocumentDownloadAdmin,
  rejectProviderVerification,
  startReviewProviderVerification,
} from '../../api/training'
import { ApiError } from '../../api/client'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TextField } from '../../components/ui/TextField'
import { useToast } from '../../components/ui/ToastContext'
import {
  TRAINING_VERIFICATION_DOCUMENT_TYPE_LABELS,
  TRAINING_VERIFICATION_STATUS_LABELS,
  trainingVerificationBadgeVariant,
} from '../../config/trainingLabels'

/** Détail d'un dossier de vérification prestataire — côté Admin : documents + actions de revue. */
export function VerificationDetailAdminModal({ verificationId, onClose, listQueryKey }) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [actionError, setActionError] = useState('')
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const queryKey = ['training', 'provider-verifications', 'admin', verificationId]
  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getProviderVerificationAdmin(verificationId),
    enabled: Boolean(verificationId),
  })
  const documents = Array.isArray(detail?.documents) ? detail.documents : []
  const status = detail?.status ?? detail?.verificationStatus ?? null

  function invalidate() {
    queryClient.invalidateQueries({ queryKey })
    if (listQueryKey) queryClient.invalidateQueries({ queryKey: listQueryKey })
  }

  const downloadMutation = useMutation({
    mutationFn: (documentId) => getProviderVerificationDocumentDownloadAdmin(verificationId, documentId),
    onSuccess: (result) => {
      if (result?.url) window.open(result.url, '_blank', 'noopener,noreferrer')
      else setActionError("Le serveur n'a pas renvoyé de lien de téléchargement.")
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Impossible de récupérer ce document.'),
  })

  const startReviewMutation = useMutation({
    mutationFn: () => startReviewProviderVerification(verificationId),
    onSuccess: () => {
      invalidate()
      setActionError('')
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Action impossible.'),
  })

  const approveMutation = useMutation({
    mutationFn: () => approveProviderVerification(verificationId),
    onSuccess: () => {
      invalidate()
      setActionError('')
      showToast('Dossier approuvé — prestataire vérifié')
      onClose()
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Action impossible.'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectProviderVerification(verificationId, rejectReason),
    onSuccess: () => {
      invalidate()
      setActionError('')
      setShowRejectForm(false)
      showToast('Dossier rejeté')
      onClose()
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Action impossible.'),
  })

  return (
    <Modal open onClose={onClose} title="Dossier de vérification">
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      ) : isError ? (
        <ApiErrorMessage error={error} fallback="Impossible de charger ce dossier." className="py-6 text-center text-sm text-danger-600" />
      ) : (
        <div className="space-y-5">
          {status && (
            <Badge variant={trainingVerificationBadgeVariant(status)}>
              {TRAINING_VERIFICATION_STATUS_LABELS[status] ?? status}
            </Badge>
          )}

          <div>
            <p className="text-sm font-medium text-ink-900 mb-2">Pièces jointes</p>
            {documents.length === 0 ? (
              <p className="text-sm text-ink-400">Aucune pièce dans ce dossier.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2"
                  >
                    <span className="text-sm text-ink-700 truncate">
                      {TRAINING_VERIFICATION_DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadMutation.mutate(doc.id)}
                      disabled={downloadMutation.isPending && downloadMutation.variables === doc.id}
                      className="text-ink-400 hover:text-primary-600 transition-colors disabled:opacity-50 shrink-0"
                      aria-label="Voir la pièce"
                      title="Voir la pièce"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showRejectForm && (
            <TextField
              id="rejectReason"
              label="Motif du rejet"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Diplôme illisible, merci de fournir une copie complète."
              required
            />
          )}

          {actionError && <Alert variant="danger">{actionError}</Alert>}

          <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-ink-100">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            {status === 'SUBMITTED' && (
              <Button type="button" variant="secondary" isLoading={startReviewMutation.isPending} onClick={() => startReviewMutation.mutate()}>
                Prendre en revue
              </Button>
            )}
            {(status === 'SUBMITTED' || status === 'UNDER_REVIEW') && (
              <>
                {showRejectForm ? (
                  <Button
                    type="button"
                    variant="danger"
                    disabled={!rejectReason.trim()}
                    isLoading={rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate()}
                  >
                    Confirmer le rejet
                  </Button>
                ) : (
                  <Button type="button" variant="danger" onClick={() => setShowRejectForm(true)}>
                    Rejeter
                  </Button>
                )}
                <Button type="button" isLoading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
                  Approuver
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
