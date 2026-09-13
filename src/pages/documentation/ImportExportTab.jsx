import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, History, Upload } from 'lucide-react'
import { exporterDonnees, importerFichier, listExports, listImports } from '../../api/documentation'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { TRANSFERT_FORMAT_OPTIONS } from '../../config/documentationLabels'
import { formatDateTime } from '../../lib/formatDate'
import { pick } from '../../lib/pick'

const EMPTY_FORM = { entite: '', format: 'CSV', perimetre: '' }

/** `TransfertDto` : entite/format requis + perimetre optionnel (filtre libre). */
function ImportForm({ etablissementId, onDone }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (formData) => importerFichier(etablissementId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation', 'imports', etablissementId] })
      setForm(EMPTY_FORM)
      setFile(null)
      onDone()
    },
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.entite.trim()) {
      setFormError("L'entité concernée est requise.")
      return
    }
    if (!file) {
      setFormError('Choisis un fichier à importer.')
      return
    }
    try {
      const formData = new FormData()
      formData.append('fichier', file)
      formData.append('entite', form.entite)
      formData.append('format', form.format)
      if (form.perimetre) formData.append('perimetre', form.perimetre)
      await mutation.mutateAsync(formData)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-2xl border border-ink-100 p-5">
      <p className="text-sm font-medium text-ink-900">Importer un fichier</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField id="import-entite" label="Entité" value={form.entite} onChange={(e) => setForm((f) => ({ ...f, entite: e.target.value }))} placeholder="eleves" required />
        <Select
          id="import-format"
          label="Format"
          options={TRANSFERT_FORMAT_OPTIONS}
          value={form.format}
          onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
        />
      </div>
      <TextField id="import-perimetre" label="Périmètre (optionnel)" value={form.perimetre} onChange={(e) => setForm((f) => ({ ...f, perimetre: e.target.value }))} placeholder="classe=CM2" />
      <div>
        <label htmlFor="import-fichier" className="block text-sm font-medium text-ink-700 mb-1.5">
          Fichier<span className="text-danger-500"> *</span>
        </label>
        <input
          id="import-fichier"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
        />
      </div>
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" isLoading={mutation.isPending}>
          <Upload className="h-3.5 w-3.5" />
          Importer
        </Button>
      </div>
    </form>
  )
}

function ExportForm({ etablissementId, onDone }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [resultMessage, setResultMessage] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload) => exporterDonnees(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation', 'exports', etablissementId] })
      onDone()
    },
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setResultMessage('')
    if (!form.entite.trim()) {
      setFormError("L'entité concernée est requise.")
      return
    }
    try {
      const payload = { entite: form.entite, format: form.format, ...(form.perimetre ? { perimetre: form.perimetre } : {}) }
      const result = await mutation.mutateAsync(payload)
      const url = pick(result, ['url', 'fichierUrl', 'telechargementUrl', 'lien'], null)
      if (url && /^https?:\/\//i.test(url)) {
        window.open(url, '_blank', 'noopener,noreferrer')
        setResultMessage('Export généré et ouvert dans un nouvel onglet.')
      } else {
        setResultMessage("Export lancé — vérifie l'historique ci-dessous.")
      }
      setForm(EMPTY_FORM)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-2xl border border-ink-100 p-5">
      <p className="text-sm font-medium text-ink-900">Exporter des données</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField id="export-entite" label="Entité" value={form.entite} onChange={(e) => setForm((f) => ({ ...f, entite: e.target.value }))} placeholder="eleves" required />
        <Select
          id="export-format"
          label="Format"
          options={TRANSFERT_FORMAT_OPTIONS}
          value={form.format}
          onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
        />
      </div>
      <TextField id="export-perimetre" label="Périmètre (optionnel)" value={form.perimetre} onChange={(e) => setForm((f) => ({ ...f, perimetre: e.target.value }))} placeholder="classe=CM2" />
      {formError && <Alert variant="danger">{formError}</Alert>}
      {resultMessage && <Alert variant="success">{resultMessage}</Alert>}
      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" isLoading={mutation.isPending}>
          <Download className="h-3.5 w-3.5" />
          Exporter
        </Button>
      </div>
    </form>
  )
}

function HistoryList({ title, items, isLoading, isError }) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-2">
        <History className="h-3.5 w-3.5 text-ink-400" />
        <p className="text-sm font-medium text-ink-900">{title}</p>
      </div>
      {isLoading && (
        <div className="p-8 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}
      {isError && <p className="p-6 text-center text-sm text-danger-600">Impossible de charger l'historique.</p>}
      {!isLoading && !isError && items.length === 0 && <p className="p-6 text-center text-sm text-ink-400">Aucun historique pour l'instant.</p>}
      {!isLoading && !isError && items.length > 0 && (
        <div className="divide-y divide-ink-50">
          {items.map((it, index) => (
            <div key={pick(it, ['id'], index)} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-ink-900 truncate">{pick(it, ['entite'])}</p>
                <p className="text-xs text-ink-400">{pick(it, ['format'])} {pick(it, ['perimetre'], '') ? `· ${pick(it, ['perimetre'])}` : ''}</p>
              </div>
              <p className="text-xs text-ink-400 shrink-0">{formatDateTime(pick(it, ['createdAt'], null)) ?? '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ImportExportTab({ etablissementId }) {
  const importsQuery = useQuery({
    queryKey: ['documentation', 'imports', etablissementId],
    queryFn: () => listImports(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const exportsQuery = useQuery({
    queryKey: ['documentation', 'exports', etablissementId],
    queryFn: () => listExports(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const imports = Array.isArray(importsQuery.data) ? importsQuery.data : (importsQuery.data?.items ?? [])
  const exports = Array.isArray(exportsQuery.data) ? exportsQuery.data : (exportsQuery.data?.items ?? [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ImportForm etablissementId={etablissementId} onDone={() => {}} />
        <HistoryList title="Historique des imports" items={imports} isLoading={importsQuery.isLoading} isError={importsQuery.isError} />
      </div>
      <div className="space-y-4">
        <ExportForm etablissementId={etablissementId} onDone={() => {}} />
        <HistoryList title="Historique des exports" items={exports} isLoading={exportsQuery.isLoading} isError={exportsQuery.isError} />
      </div>
    </div>
  )
}
