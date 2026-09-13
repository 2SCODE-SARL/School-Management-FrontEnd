import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Pencil, Plus } from 'lucide-react'
import { createTemplate, listTemplates, updateTemplate } from '../../api/communication'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { CANAL_LABELS, CANAL_OPTIONS, TEMPLATE_CODE_LABELS } from '../../config/communicationLabels'
import { TemplateForm } from './TemplateForm'

/** Modèles de message réutilisables (Admin/Directeur) — création + liste + modification (sujet/contenu seulement). */
export function TemplatesTab({ etablissementId }) {
  const [canalFilter, setCanalFilter] = useState('')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const queryClient = useQueryClient()

  const queryKey = ['communication', 'templates', etablissementId, canalFilter]
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listTemplates(etablissementId, canalFilter),
    enabled: Boolean(etablissementId),
  })
  const templates = Array.isArray(data) ? data : (data?.items ?? [])

  const createMutation = useMutation({
    mutationFn: (payload) => createTemplate(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'templates', etablissementId] })
      setCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTemplate(etablissementId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'templates', etablissementId] })
      setEditingTemplate(null)
    },
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="max-w-xs w-full">
          <Select
            id="canal-filter"
            label="Canal"
            options={[{ value: '', label: 'Tous' }, ...CANAL_OPTIONS]}
            value={canalFilter}
            onChange={(e) => setCanalFilter(e.target.value)}
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouveau modèle
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <p className="p-8 text-center text-sm text-danger-600">Impossible de charger les modèles.</p>}
        {!isLoading && !isError && templates.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun modèle pour l'instant.
          </div>
        )}
        {!isLoading && !isError && templates.length > 0 && (
          <div className="divide-y divide-ink-50">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {TEMPLATE_CODE_LABELS[t.code] ?? t.code}
                    </p>
                    <Badge variant="neutral">{CANAL_LABELS[t.canal] ?? t.canal}</Badge>
                  </div>
                  {t.sujet && <p className="text-xs text-ink-500 truncate">{t.sujet}</p>}
                  <p className="text-xs text-ink-400 truncate">{t.contenu}</p>
                </div>
                <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setEditingTemplate(t)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Nouveau modèle de message">
        <TemplateForm
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      </Modal>

      <Modal open={Boolean(editingTemplate)} onClose={() => setEditingTemplate(null)} title="Modifier le modèle">
        {editingTemplate && (
          <TemplateForm
            initialValues={editingTemplate}
            isSubmitting={updateMutation.isPending}
            onCancel={() => setEditingTemplate(null)}
            onSubmit={(payload) => updateMutation.mutateAsync({ id: editingTemplate.id, payload })}
          />
        )}
      </Modal>
    </div>
  )
}
