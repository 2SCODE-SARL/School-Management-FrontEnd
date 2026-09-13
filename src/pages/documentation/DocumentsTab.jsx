import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Search } from 'lucide-react'
import { listDocuments, uploadDocument } from '../../api/documentation'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { TruncatedText } from '../../components/ui/TruncatedText'
import {
  CATEGORIE_DOCUMENT_LABELS,
  CATEGORIE_DOCUMENT_OPTIONS,
  STATUT_DOCUMENT_LABELS,
  statutDocumentBadgeVariant,
} from '../../config/documentationLabels'
import { formatDate } from '../../lib/formatDate'
import { UploadDocumentForm } from './UploadDocumentForm'
import { DocumentDetailModal } from './DocumentDetailModal'

const CATEGORIE_FILTER_OPTIONS = [{ value: '', label: 'Toutes les catégories' }, ...CATEGORIE_DOCUMENT_OPTIONS]
const STATUT_FILTER_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIF', label: 'Actif' },
  { value: 'ARCHIVE', label: 'Archivé' },
]

export function DocumentsTab({ etablissementId }) {
  const [search, setSearch] = useState('')
  const [categorieFilter, setCategorieFilter] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isUploadOpen, setUploadOpen] = useState(false)
  const [viewingDocument, setViewingDocument] = useState(null)
  const debouncedSearch = useDebouncedValue(search)
  const queryClient = useQueryClient()

  const queryKey = [
    'documentation',
    'documents',
    etablissementId,
    { q: debouncedSearch, categorieCode: categorieFilter, statut: statutFilter, page },
  ]
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () =>
      listDocuments(etablissementId, {
        q: debouncedSearch || undefined,
        categorieCode: categorieFilter || undefined,
        statut: statutFilter || undefined,
        page,
      }),
    enabled: Boolean(etablissementId),
    placeholderData: (previous) => previous,
  })
  const items = Array.isArray(data) ? data : (data?.items ?? [])
  const viewingDocumentFresh = viewingDocument
    ? (items.find((x) => x.id === viewingDocument.id) ?? viewingDocument)
    : null

  const uploadMutation = useMutation({
    mutationFn: (formData) => uploadDocument(etablissementId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation', 'documents'] })
      setUploadOpen(false)
    },
  })

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" />
          Téléverser un document
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        <div className="p-4 border-b border-ink-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Rechercher un document..."
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
            />
          </div>
          <Select
            id="filter-categorie"
            options={CATEGORIE_FILTER_OPTIONS}
            value={categorieFilter}
            onChange={(e) => {
              setCategorieFilter(e.target.value)
              setPage(1)
            }}
            className="w-52"
          />
          <Select
            id="filter-statut"
            options={STATUT_FILTER_OPTIONS}
            value={statutFilter}
            onChange={(e) => {
              setStatutFilter(e.target.value)
              setPage(1)
            }}
            className="w-40"
          />
        </div>

        {isLoading && (
          <div className="p-16 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les documents.</p>}
        {!isLoading && !isError && items.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun document pour le moment.
          </div>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Titre</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {items.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setViewingDocument(doc)}
                    className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <TruncatedText text={doc.titre} maxWidth={240} className="font-medium text-ink-900" />
                    </td>
                    <td className="px-4 py-3 text-ink-600">{CATEGORIE_DOCUMENT_LABELS[doc.categorieCode] ?? doc.categorieCode ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-600">
                      <TruncatedText text={doc.type} maxWidth={160} />
                    </td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(doc.createdAt) ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statutDocumentBadgeVariant(doc.statut)}>
                        {STATUT_DOCUMENT_LABELS[doc.statut] ?? doc.statut ?? '—'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && !Array.isArray(data) && (
          <div className="px-4 pb-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={isUploadOpen} onClose={() => setUploadOpen(false)} title="Téléverser un document">
        <UploadDocumentForm
          isSubmitting={uploadMutation.isPending}
          onCancel={() => setUploadOpen(false)}
          onSubmit={(formData) => uploadMutation.mutateAsync(formData)}
        />
      </Modal>

      <DocumentDetailModal
        document={viewingDocumentFresh}
        etablissementId={etablissementId}
        onClose={() => setViewingDocument(null)}
      />
    </div>
  )
}
