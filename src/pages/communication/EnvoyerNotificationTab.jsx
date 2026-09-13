import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { envoyerNotification, listTemplates } from '../../api/communication'
import { searchUsers } from '../../api/users'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Combobox } from '../../components/ui/Combobox'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { CANAL_OPTIONS, TEMPLATE_CODE_OPTIONS } from '../../config/communicationLabels'
import { rules, validate } from '../../lib/validate'

/** Envoie une notification ponctuelle à un utilisateur — Admin/Directeur/Secrétaire. */
export function EnvoyerNotificationTab({ etablissementId }) {
  const [destinataireId, setDestinataireId] = useState('')
  const [type, setType] = useState(TEMPLATE_CODE_OPTIONS[0].value)
  const [canal, setCanal] = useState('EMAIL')
  const [sujet, setSujet] = useState('')
  const [contenu, setContenu] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: usersData } = useQuery({
    queryKey: ['users', 'options', etablissementId],
    queryFn: () => searchUsers({ etablissementId, limit: 100 }),
    enabled: Boolean(etablissementId),
  })
  const destinataireOptions = (usersData?.items ?? []).map((u) => ({
    value: u.id,
    label: `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() + (u.email ? ` (${u.email})` : ''),
  }))

  // Modèles existants pour ce type+canal — pré-remplit sujet/contenu, reste modifiable.
  const { data: templatesData } = useQuery({
    queryKey: ['communication', 'templates', etablissementId, canal],
    queryFn: () => listTemplates(etablissementId, canal),
    enabled: Boolean(etablissementId),
  })
  const templates = Array.isArray(templatesData) ? templatesData : (templatesData?.items ?? [])
  const matchingTemplate = templates.find((t) => t.code === type)

  function applyTemplate() {
    if (!matchingTemplate) return
    setSujet(matchingTemplate.sujet ?? '')
    setContenu(matchingTemplate.contenu ?? '')
  }

  const sendMutation = useMutation({
    mutationFn: (payload) => envoyerNotification(etablissementId, payload),
    onSuccess: () => {
      setSuccess(true)
      setContenu('')
      setSujet('')
      setDestinataireId('')
    },
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSuccess(false)
    const errors = validate(
      { destinataireId, contenu },
      {
        destinataireId: [rules.required('Choisis un destinataire.')],
        contenu: [rules.required('Le contenu est requis.')],
      },
    )
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await sendMutation.mutateAsync({
        destinataireId,
        type,
        canal,
        ...(sujet ? { sujet } : {}),
        contenu,
      })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-ink-100 p-5" noValidate>
        <Combobox
          id="destinataireId"
          label="Destinataire"
          options={destinataireOptions}
          value={destinataireId}
          onChange={setDestinataireId}
          placeholder="Rechercher un utilisateur..."
          searchPlaceholder="Rechercher par nom..."
          error={fieldErrors.destinataireId}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="type" label="Type de message" options={TEMPLATE_CODE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} required />
          <Select id="canal" label="Canal" options={CANAL_OPTIONS} value={canal} onChange={(e) => setCanal(e.target.value)} required />
        </div>

        {matchingTemplate && (
          <button
            type="button"
            onClick={applyTemplate}
            className="text-sm text-primary-600 hover:underline"
          >
            Utiliser le modèle "{matchingTemplate.sujet || TEMPLATE_CODE_OPTIONS.find((o) => o.value === type)?.label}"
          </button>
        )}

        <div>
          <label htmlFor="sujet" className="block text-sm font-medium text-ink-700 mb-1.5">
            Sujet (optionnel)
          </label>
          <input
            id="sujet"
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="contenu" className="block text-sm font-medium text-ink-700 mb-1.5">
            Contenu<span className="text-danger-500"> *</span>
          </label>
          <textarea
            id="contenu"
            rows={5}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
          />
          {fieldErrors.contenu && <p className="text-xs text-danger-600 mt-1.5">{fieldErrors.contenu}</p>}
        </div>

        {formError && <Alert variant="danger">{formError}</Alert>}
        {success && <Alert variant="success">Notification envoyée.</Alert>}

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={sendMutation.isPending}>
            <Send className="h-4 w-4" />
            Envoyer
          </Button>
        </div>
      </form>
    </div>
  )
}
