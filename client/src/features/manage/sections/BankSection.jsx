import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { depositIntoBank } from '/src/api/tournaments.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { Button, Card, CardHeader, Field, Input, Modal } from '/src/components/ui/index.js'
import { formatCredits } from '/src/lib/format.js'
import { useManageMutation } from '../useManageMutation.js'

/**
 * The prize bank.
 *
 * Entry fees flow in on their own; the host tops up whatever the fees do not
 * cover. The original built this dialog out of `document.createElement` and
 * validated the amount by rewriting the input's value as you typed.
 */
export function BankSection({ tournament }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const needed = tournament.bankShortfall
  const percent = tournament.bankRequired
    ? Math.min(100, Math.round((tournament.bank / tournament.bankRequired) * 100))
    : 100

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { amount: needed } })

  const deposit = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: ({ amount }) => depositIntoBank(tournament.id, Number(amount)),
    success: 'Added to the prize bank',
    onDone: () => {
      setOpen(false)
      reset({ amount: 0 })
    },
  })

  return (
    <Card>
      <CardHeader
        title="Prize bank"
        subtitle="The bank has to cover the advertised prizes before the tournament can start."
        actions={
          needed > 0 &&
          !tournament.hasEnded && (
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              Top up
            </Button>
          )
        }
      />

      <div className="bank">
        <div
          className="bank__bar"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Prize bank"
        >
          <div className="bank__fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="bank__figures">
          <strong>{formatCredits(tournament.bank)}</strong> of{' '}
          {formatCredits(tournament.bankRequired)}
          {needed > 0 && <span className="bank__short"> — {formatCredits(needed)} short</span>}
        </p>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Top up the prize bank"
        description={`The bank needs ${formatCredits(needed)}. You have ${formatCredits(user?.credits ?? 0)}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={deposit.isPending}>
              Cancel
            </Button>
            <Button type="submit" form="deposit-form" variant="primary" loading={deposit.isPending}>
              Add to bank
            </Button>
          </>
        }
      >
        <form id="deposit-form" onSubmit={handleSubmit((values) => deposit.mutate(values))}>
          <Field
            label="Amount"
            required
            error={errors.amount?.message}
            // Anything above the shortfall is capped by the server rather than
            // rejected, so the host is told rather than corrected mid-keystroke.
            hint={`Anything above ${formatCredits(needed)} is trimmed to what the bank still needs.`}
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                min="1"
                {...register('amount', {
                  required: 'Enter an amount',
                  min: { value: 1, message: 'At least 1 credit' },
                  max: {
                    value: user?.credits ?? 0,
                    message: `You only have ${formatCredits(user?.credits ?? 0)}`,
                  },
                })}
              />
            )}
          </Field>
        </form>
      </Modal>
    </Card>
  )
}
