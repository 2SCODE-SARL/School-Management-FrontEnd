import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Archive, ArchiveRestore, Eye, Tag, Trash2 } from 'lucide-react'
import { archiverDocument, deleteDocument, restaurerDocument } from '../../api/documentation'
import { Modal } from '../../components/ui/Modal'
import { InfoRow } from '../../components/ui/InfoRow'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Alert } from '../../components/ui/Alert'
import {
  CATEGORIE_DOCUMENT_LABELS,
  FORMAT_DOCUMENT_LABELS,
  STATUT_DOCUMENT_LABELS,
  statutDocumentBadgeVariant,
} from '../../config/documentationLabels'
import { formatDateTime } from '../../lib/formatDate'

/**
 * Détail d'un document du module Documentation. Comme signalé au backend
 * (aucun lien de visualisation côté staff, seulement `fichierUrl: "s3://..."`),
 * on ouvre directement seulement si c'est déjà une URL http(s) — sinon on
 * explique clairement la limitation plutôt que d'échouer silencieusement.
 */
export function DocumentDetailModal({ document, etablissementId, onClose }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [viewError, setViewError] = useState('')
  const queryClient = useQueryClient()

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['documentation', 'documents'] })
  }

  const archiverMutation = useMutation({
    mutationFn: () => archiverDocument(etablissementId, document?.id),
    onSuccess: invalidateAll,
  })
  const restaurerMutation = useMutation({
    mutationFn: () => restaurerDocument(etablissementId, document?.id),
    onSuccess: invalidateAll,
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteDocument(etablissementId, document?.id),
    onSuccess: () => {
      invalidateAll()
      setConfirmDelete(false)
      onClose()
    },
  })

  if (!document) return null
  const isArchive = document.statut === 'ARCHIVE'

  function handleView() {
    setViewError('')
    if (/^https?:\/\//i.test(document.fichierUrl ?? '')) {
      window.open(document.fichierUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setViewError(
      "Ce document est stocké en interne (chemin de stockage brut) — le backend ne fournit pas encore de lien de visualisation pour le personnel. Signalé, en attente d'un endpoint dédié.",
    )
  }

  return (
    <>
      <Modal open={Boolean(document)} onClose={onClose} title="Détail du document">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="font-heading font-bold text-ink-900 truncate">{document.titre}</p>
          <Badge variant={statutDocumentBadgeVariant(document.statut)} className="shrink-0">
            {STATUT_DOCUMENT_LABELS[document.statut] ?? document.statut ?? '—'}
          </Badge>
        </div>

        <div className="mb-2">
          <InfoRow icon={Tag} label="Catégorie" value={CATEGORIE_DOCUMENT_LABELS[document.categorieCode] ?? document.categorieCode} />
          <InfoRow icon={Tag} label="Type" value={document.type} />
          <InfoRow icon={Tag} label="Format" value={FORMAT_DOCUMENT_LABELS[document.format] ?? document.format} />
          <InfoRow icon={Tag} label="Confidentialité" value={document.confidentialite} />
          <InfoRow icon={Tag} label="Tags" value={document.tags} />
          <InfoRow icon={Tag} label="Téléversé le" value={formatDateTime(document.createdAt)} />
        </div>

        {document.description && (
          <div className="pt-3 border-t border-ink-100">
            <p className="text-xs text-ink-400 mb-1">Description</p>
            <p className="text-sm text-ink-700">{document.description}</p>
          </div>
        )}

        {viewError && (
          <Alert variant="warning" className="mt-3">
            {viewError}
          </Alert>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-5 mt-4 border-t border-ink-100">
          <Button variant="secondary" size="sm" className="!text-danger-600" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer
          </Button>
          {isArchive ? (
            <Button variant="secondary" size="sm" isLoading={restaurerMutation.isPending} onClick={() => restaurerMutation.mutate()}>
              <ArchiveRestore className="h-3.5 w-3.5" />
              Restaurer
            </Button>
          ) : (
            <Button variant="secondary" size="sm" isLoading={archiverMutation.isPending} onClick={() => archiverMutation.mutate()}>
              <Archive className="h-3.5 w-3.5" />
              Archiver
            </Button>
          )}
          <Button size="sm" onClick={handleView}>
            <Eye className="h-3.5 w-3.5" />
            Voir
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title="Supprimer ce document ?"
        description="Le fichier et sa fiche seront supprimés définitivement."
        confirmLabel="Supprimer"
      />
    </>
  )
}
