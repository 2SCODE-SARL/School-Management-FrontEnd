import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Alert } from '../../../components/ui/Alert'

/**
 * Affiche les identifiants d'un compte juste après création ou
 * réinitialisation — le mot de passe en clair n'est disponible qu'ici,
 * une seule fois (le backend ne le renvoie jamais, il est haché).
 */
export function PasswordRevealModal({ open, onClose, email, password }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard
      .writeText(`Email : ${email}\nMot de passe : ${password}`)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Identifiants du compte"
      maxWidth="max-w-sm"
    >
      <Alert variant="warning" className="mb-4">
        Ce mot de passe ne sera plus jamais affiché. Transmets-le maintenant à
        l'utilisateur (téléphone, e-mail, WhatsApp...).
      </Alert>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-ink-500 mb-1">Email</p>
          <p className="text-sm font-mono bg-ink-50 border border-ink-200 rounded-lg px-3 py-2 text-ink-900 break-all">
            {email}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-ink-500 mb-1">Mot de passe</p>
          <p className="text-sm font-mono bg-ink-50 border border-ink-200 rounded-lg px-3 py-2 text-ink-900 break-all">
            {password}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5">
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
        <Button onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copié !' : 'Copier les identifiants'}
        </Button>
      </div>
    </Modal>
  )
}
