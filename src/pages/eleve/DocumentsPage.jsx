import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, FolderOpen } from 'lucide-react'
import { listDocuments } from '../../api/portailEleve'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { Pagination } from '../../components/ui/Pagination'
import { DOCUMENT_ELEVE_TYPE_LABELS } from '../../config/portailEleveLabels'
import { formatDate } from '../../lib/formatDate'

const TYPE_OPTIONS = [{ value: '', label: 'Tous les types' }, ...Object.entries(DOCUMENT_ELEVE_TYPE_LABELS).map(([value, label]) => ({ value, label }))]

export default function DocumentsPage() {
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['portail-eleve', 'documents', type, page],
    queryFn: () => listDocuments({ type, page, limit: 20 }),
  })
  const documents = data?.items ?? []

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <h1 className="font-heading text-2xl font-bold text-ink-900">Mes documents</h1>
        <div className="max-w-xs w-full">
          <Select
            id="type-filter"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger tes documents." />}
        {!isLoading && !isError && documents.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <FolderOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun document pour l'instant.
          </div>
        )}
        {!isLoading && !isError && documents.length > 0 && (
          <div className="divide-y divide-ink-50">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{doc.titre}</p>
                  <p className="text-xs text-ink-400 truncate">
                    <Badge variant="neutral" className="mr-2">
                      {DOCUMENT_ELEVE_TYPE_LABELS[doc.type] ?? doc.type}
                    </Badge>
                    {formatDate(doc.createdAt)}
                  </p>
                </div>
                {doc.telechargementUrl ? (
                  <a
                    href={doc.telechargementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Voir
                  </a>
                ) : (
                  <span className="text-xs text-ink-400 shrink-0">Indisponible</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-3">
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
