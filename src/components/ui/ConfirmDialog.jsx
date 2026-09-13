import { Modal } from './Modal'
import { Button } from './Button'

/** Boîte de confirmation générique avant une action sensible (suppression...). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  variant = 'danger',
  isLoading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-ink-600">{description}</p>
      <div className="flex justify-end gap-3 pt-5">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
