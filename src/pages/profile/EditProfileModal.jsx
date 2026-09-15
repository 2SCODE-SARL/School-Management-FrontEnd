import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Camera } from 'lucide-react'
import { updateMyProfile } from '../../api/profile'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { Avatar } from '../../components/ui/Avatar'
import { ApiError } from '../../api/client'

/**
 * `PATCH /users/me/profile` (self-service) : limité à téléphone, adresse et
 * photo — tout le reste (nom, rôle, établissement...) reste réservé à la
 * Direction (`PATCH /users/{id}`), d'où l'absence de ces champs ici.
 */
export function EditProfileModal({ open, user, displayName, onClose, onSuccess }) {
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [formError, setFormError] = useState('')

  // Repart des valeurs actuelles à chaque ouverture (pas au montage) pour
  // ne pas figer un état obsolète si le profil s'est rechargé entre-temps.
  useEffect(() => {
    if (open) {
      setTelephone(user?.telephone ?? '')
      setAdresse(user?.adresse ?? '')
      setPhotoFile(null)
      setPhotoPreview(null)
      setFormError('')
    }
  }, [open, user])

  const mutation = useMutation({
    mutationFn: () => updateMyProfile({ telephone, adresse, photo: photoFile }),
    onSuccess: () => onSuccess(),
  })

  function handlePhotoChange(e) {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
    setPhotoPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    try {
      await mutation.mutateAsync()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Modifier le profil" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="flex items-center gap-4">
          <Avatar name={displayName} src={photoPreview || user?.photoUrl} size={64} />
          <label className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 cursor-pointer hover:bg-ink-50 transition-colors">
            <Camera className="h-4 w-4" />
            Changer la photo
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>
        {photoFile && <p className="text-xs text-ink-400">Nouvelle photo : {photoFile.name}</p>}

        <TextField
          id="telephone"
          label="Téléphone"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          placeholder="+224620000000"
        />
        <TextField
          id="adresse"
          label="Adresse"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Conakry, Ratoma"
        />

        {formError && <Alert variant="danger">{formError}</Alert>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
