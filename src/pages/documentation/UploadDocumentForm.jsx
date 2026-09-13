import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { CATEGORIE_DOCUMENT_OPTIONS, CONFIDENTIALITE_OPTIONS, FORMAT_DOCUMENT_OPTIONS, guessFormatFromFileName } from '../../config/documentationLabels'

const EMPTY_FORM = {
  categorieCode: CATEGORIE_DOCUMENT_OPTIONS[0].value,
  type: '',
  titre: '',
  description: '',
  format: 'PDF',
  tags: '',
  confidentialite: '',
}

/**
 * Upload d'un document dans le module Documentation central —
 * `DocumentationUploadDocumentDto` : categorieCode/type/titre/format
 * requis (multipart, champ `fichier`). `type` n'est pas un enum fixe côté
 * doc (juste un exemple "ACTE_NAISSANCE") : on le laisse en texte libre.
 */
export function UploadDocumentForm({ onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f) setForm((prev) => ({ ...prev, format: guessFormatFromFileName(f.name) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate(form, {
      type: [rules.required('Le type de document est requis.')],
      titre: [rules.required('Le titre est requis.')],
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    if (!file) {
      setFormError('Choisis un fichier à téléverser.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('fichier', file)
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '') formData.append(key, value)
      })
      await onSubmit(formData)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="fichier" className="block text-sm font-medium text-ink-700 mb-1.5">
          Fichier<span className="text-danger-500"> *</span>
        </label>
        <input
          id="fichier"
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip"
          onChange={handleFileChange}
          className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
        />
      </div>

      <TextField
        id="titre"
        label="Titre"
        required
        value={form.titre}
        onChange={update('titre')}
        error={fieldErrors.titre}
        placeholder="Acte de naissance de Diallo"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select id="categorieCode" label="Catégorie" options={CATEGORIE_DOCUMENT_OPTIONS} value={form.categorieCode} onChange={update('categorieCode')} required />
        <TextField
          id="type"
          label="Type"
          required
          value={form.type}
          onChange={update('type')}
          error={fieldErrors.type}
          placeholder="ACTE_NAISSANCE"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select id="format" label="Format" options={FORMAT_DOCUMENT_OPTIONS} value={form.format} onChange={update('format')} required />
        <Select
          id="confidentialite"
          label="Confidentialité (optionnel)"
          options={[{ value: '', label: '—' }, ...CONFIDENTIALITE_OPTIONS]}
          value={form.confidentialite}
          onChange={update('confidentialite')}
        />
      </div>

      <TextField id="tags" label="Tags (optionnel, séparés par des virgules)" value={form.tags} onChange={update('tags')} placeholder="inscription, 2026" />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink-700 mb-1.5">
          Description (optionnel)
        </label>
        <textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={update('description')}
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
        />
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <Upload className="h-3.5 w-3.5" />
          Téléverser
        </Button>
      </div>
    </form>
  )
}
