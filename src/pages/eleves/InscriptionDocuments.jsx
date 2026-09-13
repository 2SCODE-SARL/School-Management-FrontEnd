import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, FileCheck, Upload } from 'lucide-react'
import {
  listInscriptionDocuments,
  listTypesDocuments,
  setDocumentStatut,
  uploadInscriptionDocument,
} from '../../api/inscriptions'
import { uploadDocument } from '../../api/documentation'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { pick } from '../../lib/pick'
import { DOCUMENT_STATUT_OPTIONS } from '../../config/eleveLabels'

const EXTENSION_TO_FORMAT = {
  pdf: 'PDF',
  doc: 'WORD',
  docx: 'WORD',
  xls: 'EXCEL',
  xlsx: 'EXCEL',
  jpg: 'IMAGE',
  jpeg: 'IMAGE',
  png: 'IMAGE',
  gif: 'IMAGE',
  webp: 'IMAGE',
  zip: 'ZIP',
}

function guessFormat(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return EXTENSION_TO_FORMAT[ext] ?? 'PDF'
}

/**
 * Petit formulaire pour réceptionner un document : soit un vrai fichier
 * (PDF/image/...) téléversé dans le module Documentation puis relié à
 * l'inscription, soit un document reçu en version papier (pas de fichier).
 */
function ReceptionnerForm({ etablissementId, typeDocument, eleveNom, onCancel, onSubmit, isSubmitting }) {
  const [mode, setMode] = useState('fichier')
  const [file, setFile] = useState(null)
  const [isUploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (mode === 'papier') {
      try {
        await onSubmit({})
      } catch (err) {
        setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
      }
      return
    }

    if (!file) {
      setFormError('Choisis un fichier, ou passe en "reçu en version papier".')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('fichier', file)
      formData.append('categorieCode', 'ELEVE')
      formData.append('type', typeDocument.code)
      formData.append('titre', `${typeDocument.libelle} — ${eleveNom}`)
      formData.append('format', guessFormat(file.name))

      const uploaded = await uploadDocument(etablissementId, formData)
      const fichierUrl = pick(uploaded, ['url', 'fichierUrl', 'cheminFichier', 'lien', 'path'], null)
      if (!fichierUrl) {
        setFormError(
          "Le fichier a été envoyé mais son URL n'a pas pu être retrouvée dans la réponse du serveur — signale ce cas, la réponse ne correspond à aucun champ attendu.",
        )
        setUploading(false)
        return
      }

      await onSubmit({ fichierUrl })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-ink-600">
        Réceptionner : <span className="font-medium text-ink-900">{typeDocument.libelle}</span>
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('fichier')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'fichier' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-ink-200 text-ink-600'
          }`}
        >
          Téléverser un fichier
        </button>
        <button
          type="button"
          onClick={() => setMode('papier')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'papier' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-ink-200 text-ink-600'
          }`}
        >
          Reçu en version papier
        </button>
      </div>

      {mode === 'fichier' ? (
        <div>
          <label htmlFor="fichier" className="block text-sm font-medium text-ink-700 mb-1.5">
            Fichier (PDF, image, Word, Excel...)
          </label>
          <input
            id="fichier"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>
      ) : (
        <p className="text-sm text-ink-400">
          Le document sera marqué reçu sans fichier attaché (registre papier de l'établissement).
        </p>
      )}

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting || isUploading}>
          <Upload className="h-3.5 w-3.5" />
          Réceptionner
        </Button>
      </div>
    </form>
  )
}

/**
 * Suivi des documents d'inscription (acte de naissance, certificat...) —
 * étape mentionnée par le backend comme requise avant de valider un
 * dossier, même si ce n'est pas (encore ?) vérifié par la transition de
 * statut elle-même.
 */
export function InscriptionDocuments({ etablissementId, inscriptionId, eleveNom }) {
  const [receptionnerType, setReceptionnerType] = useState(null)
  const [viewError, setViewError] = useState('')
  const queryClient = useQueryClient()

  const { data: typesData } = useQuery({
    queryKey: ['inscriptions', 'types-documents', etablissementId],
    queryFn: () => listTypesDocuments(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const types = Array.isArray(typesData) ? typesData : (typesData?.items ?? [])

  const documentsQueryKey = ['inscriptions', 'documents', etablissementId, inscriptionId]
  const { data: documentsData, isLoading } = useQuery({
    queryKey: documentsQueryKey,
    queryFn: () => listInscriptionDocuments(etablissementId, inscriptionId),
    enabled: Boolean(etablissementId && inscriptionId),
  })
  const documents = Array.isArray(documentsData) ? documentsData : (documentsData?.items ?? [])
  const documentByTypeId = Object.fromEntries(documents.map((d) => [d.typeDocumentId, d]))

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: documentsQueryKey })
  }

  // Le backend ne fournit pour l'instant un lien signé consultable
  // (`telechargementUrl`) que côté portail élève — pas sur cette API
  // admin, qui ne renvoie que le chemin de stockage brut (`s3://...`,
  // pas ouvrable directement par un navigateur). On ouvre quand même si
  // jamais c'est déjà une URL http(s), sinon on prévient clairement.
  function handleView(doc) {
    setViewError('')
    if (/^https?:\/\//i.test(doc.fichierUrl ?? '')) {
      window.open(doc.fichierUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setViewError(
      "Ce document est stocké en interne (chemin de stockage brut) — le backend ne fournit pas encore de lien de visualisation pour le personnel. Signalé, en attente d'un endpoint dédié.",
    )
  }

  const uploadMutation = useMutation({
    mutationFn: (data) => uploadInscriptionDocument(etablissementId, inscriptionId, data),
    onSuccess: () => {
      invalidateAll()
      setReceptionnerType(null)
    },
  })

  const statutMutation = useMutation({
    mutationFn: ({ documentId, statut }) => setDocumentStatut(etablissementId, documentId, statut),
    onSuccess: invalidateAll,
  })

  if (types.length === 0) {
    return (
      <p className="text-sm text-ink-400">
        Aucun type de document configuré — vas dans l'onglet "Types de
        documents" pour en ajouter.
      </p>
    )
  }

  return (
    <>
      {isLoading ? (
        <div className="p-4 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {types.map((type) => {
            const doc = documentByTypeId[type.id]
            return (
              <div
                key={type.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck className="h-4 w-4 text-ink-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{type.libelle}</p>
                    {type.obligatoire && <p className="text-xs text-warning-600">Obligatoire</p>}
                  </div>
                </div>
                {doc ? (
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.fichierUrl && (
                      <button
                        type="button"
                        onClick={() => handleView(doc)}
                        className="text-ink-400 hover:text-primary-600 transition-colors"
                        aria-label="Voir le document"
                        title="Voir le document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <Select
                      id={`statut-${type.id}`}
                      options={DOCUMENT_STATUT_OPTIONS}
                      value={doc.statut}
                      onChange={(e) => statutMutation.mutate({ documentId: doc.id, statut: e.target.value })}
                      className="w-36"
                    />
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setReceptionnerType(type)}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Réceptionner
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {viewError && (
        <Alert variant="warning" className="mt-3">
          {viewError}
        </Alert>
      )}

      <Modal
        open={Boolean(receptionnerType)}
        onClose={() => setReceptionnerType(null)}
        title="Réceptionner un document"
        maxWidth="max-w-sm"
      >
        {receptionnerType && (
          <ReceptionnerForm
            etablissementId={etablissementId}
            typeDocument={receptionnerType}
            eleveNom={eleveNom ?? 'Élève'}
            isSubmitting={uploadMutation.isPending}
            onCancel={() => setReceptionnerType(null)}
            onSubmit={(data) => uploadMutation.mutateAsync({ typeDocumentId: receptionnerType.id, ...data })}
          />
        )}
      </Modal>
    </>
  )
}
