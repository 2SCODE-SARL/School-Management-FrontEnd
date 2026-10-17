import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Send, Trash2, Upload } from 'lucide-react'
import {
  deleteProviderVerificationDocument,
  getMyProviderVerification,
  getProviderVerificationDocumentDownload,
  submitProviderVerification,
  uploadProviderVerificationDocument,
} from '../../api/training'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/ToastContext'
import { ApiError } from '../../api/client'
import {
  TRAINING_VERIFICATION_DOCUMENT_TYPE_LABELS,
  TRAINING_VERIFICATION_DOCUMENT_TYPE_OPTIONS,
  TRAINING_VERIFICATION_STATUS_LABELS,
  trainingVerificationBadgeVariant,
} from '../../config/trainingLabels'

const EMPTY_OPTION = [{ value: '', label: 'Choisir le type de pièce...' }]

/**
 * Dossier de vérification (KYC) d'un prestataire — côté Formateur : upload
 * de pièces, puis soumission à l'administration. Champs de la réponse lus
 * défensivement (`pick`-like), aucun schéma typé côté API pour ce DTO.
 */
export function VerificationDossierModal({ providerId, providerName, onClose }) {
  const [docType, setDocType] = useState('')
  const [actionError, setActionError] = useState('')
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const queryKey = ['training', 'provider-verifications', 'mine', providerId]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getMyProviderVerification(providerId),
    enabled: Boolean(providerId),
  })
  const documents = Array.isArray(data?.documents) ? data.documents : (Array.isArray(data) ? data : [])
  const dossierStatus = data?.status ?? data?.verificationStatus ?? null

  function invalidate() {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['training', 'providers', 'mine'] })
  }

  const uploadMutation = useMutation({
    mutationFn: ({ type, fichier }) => uploadProviderVerificationDocument(providerId, type, fichier),
    onSuccess: () => {
      invalidate()
      setDocType('')
      setActionError('')
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : "Impossible d'ajouter cette pièce."),
  })

  const deleteMutation = useMutation({
    mutationFn: (documentId) => deleteProviderVerificationDocument(providerId, documentId),
    onSuccess: () => {
      invalidate()
      setActionError('')
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Impossible de retirer cette pièce.'),
  })

  const downloadMutation = useMutation({
    mutationFn: (documentId) => getProviderVerificationDocumentDownload(providerId, documentId),
    onSuccess: (result) => {
      if (result?.url) window.open(result.url, '_blank', 'noopener,noreferrer')
      else setActionError("Le serveur n'a pas renvoyé de lien de téléchargement.")
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Impossible de récupérer ce document.'),
  })

  const submitMutation = useMutation({
    mutationFn: () => submitProviderVerification(providerId),
    onSuccess: () => {
      invalidate()
      setActionError('')
      showToast('Dossier soumis pour vérification')
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Impossible de soumettre le dossier.'),
  })

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !docType) return
    uploadMutation.mutate({ type: docType, fichier: file })
  }

  return (
    <Modal open onClose={onClose} title={`Dossier de vérification — ${providerName}`}>
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      ) : isError ? (
        <ApiErrorMessage error={error} fallback="Impossible de charger le dossier." className="py-6 text-center text-sm text-danger-600" />
      ) : (
        <div className="space-y-5">
          {dossierStatus && (
            <Badge variant={trainingVerificationBadgeVariant(dossierStatus)}>
              {TRAINING_VERIFICATION_STATUS_LABELS[dossierStatus] ?? dossierStatus}
            </Badge>
          )}

          <div>
            <p className="text-sm font-medium text-ink-900 mb-2">Pièces jointes</p>
            {documents.length === 0 ? (
              <p className="text-sm text-ink-400">Aucune pièce ajoutée pour le moment.</p>
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
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => downloadMutation.mutate(doc.id)}
                        disabled={downloadMutation.isPending && downloadMutation.variables === doc.id}
                        className="text-ink-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                        aria-label="Voir la pièce"
                        title="Voir la pièce"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending && deleteMutation.variables === doc.id}
                        className="text-ink-400 hover:text-danger-600 transition-colors disabled:opacity-50"
                        aria-label="Retirer la pièce"
                        title="Retirer la pièce"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-ink-900 mb-2">Ajouter une pièce</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                id="docType"
                options={[...EMPTY_OPTION, ...TRAINING_VERIFICATION_DOCUMENT_TYPE_OPTIONS]}
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!docType || uploadMutation.isPending}
                isLoading={uploadMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Choisir un fichier
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-ink-400 mt-1.5">PDF, JPEG ou PNG — 5 Mo maximum.</p>
          </div>

          {actionError && <Alert variant="danger">{actionError}</Alert>}

          <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            <Button
              type="button"
              disabled={documents.length === 0}
              isLoading={submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              <Send className="h-3.5 w-3.5" />
              Soumettre le dossier
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
