import { Button } from './Button.jsx'
import { Modal } from './Modal.jsx'

/**
 * Confirmation for a destructive action.
 *
 * Replaces `window.confirm`, which could not say what would happen, could not be
 * styled, and blocked the whole tab while open.
 *
 * @param {object} props
 * @param {string} props.confirmLabel What the button does, in the user's words.
 * @param {boolean} [props.destructive] Colours the confirm button as a warning.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {null}
    </Modal>
  )
}
