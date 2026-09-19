import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getPublishInfo, publishTournament, tournamentKeys } from '/src/api/tournaments.js'
import { Button, Card, CardHeader, Skeleton } from '/src/components/ui/index.js'
import { formatDateTime, formatUsd } from '/src/lib/format.js'
import { useManageMutation } from '../useManageMutation.js'
import styles from '../ManagePage.module.css'

/**
 * Getting the tournament in front of people.
 *
 * A tournament is a draft until it is published, and a draft is visible to
 * nobody but its host — so this is the first thing on the page until it is done,
 * and it disappears afterwards. Small tournaments publish for nothing; larger
 * ones are paid for, and until the card gateway is live that payment is arranged
 * by email and confirmed by a human.
 */
export function PublishSection({ tournament }) {
  const { publishState } = tournament

  const info = useQuery({
    queryKey: tournamentKeys.publish(tournament.id),
    queryFn: () => getPublishInfo(tournament.id),
    select: (data) => data.publishing,
  })

  const publish = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () => publishTournament(tournament.id),
    success:
      publishState === 'draft' && info.data?.amountCents === 0
        ? 'Your tournament is live'
        : 'Thanks — we will confirm your payment shortly',
  })

  if (publishState === 'published') return null

  if (publishState === 'pending_payment') {
    return (
      <Card className={`${styles.publish} ${styles.publishWaiting}`}>
        <CardHeader
          title="Waiting for confirmation"
          subtitle="We are checking for your transfer. This is usually the same day — you do not need to send it again."
        />
        <dl className={styles.payment}>
          <PaymentRow
            label="Amount sent"
            value={formatUsd(tournament.publishRequest?.amountCents)}
          />
          <PaymentRow label="Reference" value={tournament.id} copyable mono />
          <PaymentRow label="Sent" value={formatDateTime(tournament.publishRequest?.requestedAt)} />
        </dl>
        <p className={styles.hint}>
          Until then only you can see this tournament. Nothing else is on hold — you can keep
          editing it, and cancel it if you change your mind.
        </p>
      </Card>
    )
  }

  if (info.isPending) {
    return (
      <Card className={styles.publish}>
        <CardHeader title="Publish this tournament" />
        <Skeleton height="5rem" />
      </Card>
    )
  }

  const { tier, amountCents, contactEmail, reference, maxCapacity } = info.data ?? {}

  // Above the largest tier there is no price to quote, so the honest answer is
  // to say so and give them a way to ask, not to show a button that 400s.
  if (info.isError || !tier) {
    return (
      <Card className={styles.publish}>
        <CardHeader
          title="Publish this tournament"
          subtitle={
            info.isError
              ? 'We could not work out the publishing fee just now.'
              : `A ${maxCapacity}-slot tournament is bigger than anything on our price list.`
          }
        />
        {info.isError ? (
          <div className={styles.actions}>
            <Button onClick={() => info.refetch()}>Try again</Button>
          </div>
        ) : (
          <p className={styles.hint}>
            Tell us what you are running and we will price it. Until then, a tournament of 64 slots
            or fewer can be published from here today.
          </p>
        )}
      </Card>
    )
  }

  if (amountCents === 0) {
    return (
      <Card className={styles.publish}>
        <CardHeader
          title="Publish this tournament"
          subtitle={`Up to ${maxCapacity} players — free to publish. Nobody can see it or join until you do.`}
        />
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => publish.mutate()} loading={publish.isPending}>
            Publish now
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={styles.publish}>
      <CardHeader
        title="Publish this tournament"
        subtitle={`Up to ${maxCapacity} players, ${formatUsd(amountCents)} to publish. Email us and we will send you a payment link.`}
      />

      <dl className={styles.payment}>
        <PaymentRow label="Amount" value={formatUsd(amountCents)} />
        <PaymentRow label="Email" value={contactEmail} copyable />
        <PaymentRow label="Reference" value={reference} copyable mono />
      </dl>

      <p className={styles.hint}>
        Quote the reference so we can match your payment to this tournament. Once you have paid,
        press the button below and we will put it live — usually the same day.
      </p>

      <div className={styles.actions}>
        <Button variant="primary" onClick={() => publish.mutate()} loading={publish.isPending}>
          I have paid
        </Button>
      </div>
    </Card>
  )
}

/**
 * One line of the transfer: what to type, and a way to take it with you.
 *
 * A host is reading this on one phone and typing it into a banking app on the
 * same one, so a number they have to remember across an app switch is the step
 * where this goes wrong.
 */
function PaymentRow({ label, value, copyable = false, mono = false }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Your browser would not let us copy that — select it by hand')
    }
  }

  return (
    <div className={styles.paymentRow}>
      <dt className={styles.paymentLabel}>{label}</dt>
      <dd className={`${styles.paymentValue} ${mono ? styles.paymentMono : ''}`}>
        <span>{value}</span>
        {copyable && (
          <Button size="sm" variant="ghost" onClick={copy}>
            Copy
          </Button>
        )}
      </dd>
    </div>
  )
}
