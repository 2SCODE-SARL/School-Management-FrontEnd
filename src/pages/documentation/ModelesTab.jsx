import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileOutput, LayoutTemplate, Plus } from 'lucide-react'
import { createModele, genererPdf, listModeles } from '../../api/documentation'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { MODELE_CODE_LABELS } from '../../config/documentationLabels'
import { CreateModeleForm } from './CreateModeleForm'
import { GenererPdfForm } from './GenererPdfForm'

export function ModelesTab({ etablissementId }) {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [genererFor, setGenererFor] = useState(null)
  const queryClient = useQueryClient()

  const queryKey = ['documentation', 'modeles', etablissementId]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listModeles(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const modeles = Array.isArray(data) ? data : (data?.items ?? [])

  const createMutation = useMutation({
    mutationFn: (payload) => createModele(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setCreateOpen(false)
    },
  })

  const genererMutation = useMutation({
    mutationFn: (variables) => genererPdf(etablissementId, genererFor.id, variables),
  })

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Créer un modèle
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-16 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les modèles." />}
        {!isLoading && !isError && modeles.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <LayoutTemplate className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun modèle de document pour le moment.
          </div>
        )}
        {!isLoading && !isError && modeles.length > 0 && (
          <div className="divide-y divide-ink-50">
            {modeles.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{m.libelle}</p>
                  <p className="text-xs text-ink-400">{MODELE_CODE_LABELS[m.code] ?? m.code}</p>
                </div>
                <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setGenererFor(m)}>
                  <FileOutput className="h-3.5 w-3.5" />
                  Générer un PDF
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Créer un modèle de document">
        <CreateModeleForm
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>

      <Modal open={Boolean(genererFor)} onClose={() => setGenererFor(null)} title="Générer un PDF" maxWidth="max-w-md">
        {genererFor && (
          <GenererPdfForm
            modele={genererFor}
            isSubmitting={genererMutation.isPending}
            onCancel={() => setGenererFor(null)}
            onSubmit={(variables) => genererMutation.mutateAsync(variables)}
          />
        )}
      </Modal>
    </div>
  )
}
