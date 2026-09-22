import { useForm } from 'react-hook-form'
import { Button, Field, Modal, Textarea } from '/src/components/ui/index.js'

/**
 * A dialog that collects one required reason and submits it.
 *
 * Shared by every moderation action that is "an accusation plus a short
 * explanation" — reporting a tournament, reporting a user, and a host removing
 * a participant. One form component means one accessible, keyboard-trapped
 * dialog to get right instead of three near-identical ones.
 */
export function ReasonDialog({
  open,
  onClose,
  title,
  description,
  label,
  confirmLabel,
  destructive = false,
  submitting,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { reason: '' } })

  const close = () => {
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            form="reason-dialog-form"
            type="submit"
            loading={submitting}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form
        id="reason-dialog-form"
        onSubmit={handleSubmit(({ reason }) => onSubmit(reason, { reset, close }))}
      >
        <Field label={label} required error={errors.reason?.message}>
          {(field) => (
            <Textarea
              {...field}
              rows={4}
              {...register('reason', { required: 'A reason is required' })}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
