import { useState } from 'react'
import { FileOutput, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { pick } from '../../lib/pick'

/**
 * Génère un PDF (Puppeteer côté serveur) à partir d'un modèle et de
 * variables clé/valeur libres (`GenererPdfDto.variables`, max 50 clés,
 * exemple : nom/prenom/classe). Comme pour les autres documents, la
 * réponse (`ApiSuccessResponse` générique) n'a pas de forme confirmée —
 * on tente d'ouvrir directement si un lien http(s) en ressort, sinon on
 * affiche un message clair plutôt que de deviner.
 */
export function GenererPdfForm({ modele, onSubmit, onCancel, isSubmitting }) {
  const [pairs, setPairs] = useState([{ key: '', value: '' }])
  const [formError, setFormError] = useState('')
  const [resultMessage, setResultMessage] = useState('')

  function updatePair(index, field, value) {
    setPairs((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function addPair() {
    setPairs((prev) => [...prev, { key: '', value: '' }])
  }

  function removePair(index) {
    setPairs((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setResultMessage('')
    const variables = Object.fromEntries(pairs.filter((p) => p.key.trim() !== '').map((p) => [p.key.trim(), p.value]))
    if (Object.keys(variables).length === 0) {
      setFormError('Ajoute au moins une variable.')
      return
    }

    try {
      const result = await onSubmit(variables)
      const url = pick(result, ['url', 'fichierUrl', 'telechargementUrl', 'cheminFichier', 'lien'], null)
      if (url && /^https?:\/\//i.test(url)) {
        window.open(url, '_blank', 'noopener,noreferrer')
        setResultMessage('PDF généré et ouvert dans un nouvel onglet.')
      } else {
        setResultMessage(
          "PDF généré, mais aucun lien ouvrable n'a été retrouvé dans la réponse du serveur — vérifie l'onglet \"Documents\", il y a peut-être été ajouté.",
        )
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-ink-500">
        Modèle : <span className="font-medium text-ink-900">{modele.libelle}</span>
      </p>

      <div className="space-y-2">
        {pairs.map((p, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={p.key}
              onChange={(e) => updatePair(index, 'key', e.target.value)}
              placeholder="nom"
              className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
            />
            <input
              value={p.value}
              onChange={(e) => updatePair(index, 'value', e.target.value)}
              placeholder="Diallo"
              className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
            />
            <button
              type="button"
              onClick={() => removePair(index)}
              disabled={pairs.length === 1}
              className="text-ink-400 hover:text-danger-600 disabled:opacity-30 transition-colors"
              aria-label="Retirer cette variable"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addPair} className="flex items-center gap-1.5 text-sm text-primary-600 hover:underline">
          <Plus className="h-3.5 w-3.5" />
          Ajouter une variable
        </button>
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      {resultMessage && <Alert variant="success">{resultMessage}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Fermer
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <FileOutput className="h-3.5 w-3.5" />
          Générer le PDF
        </Button>
      </div>
    </form>
  )
}
