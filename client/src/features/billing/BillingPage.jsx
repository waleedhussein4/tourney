import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { billingKeys, getMyBilling, startCheckout } from '/src/api/billing.js'
import { currentUserKey } from '/src/features/auth/queries.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Badge, Button, Card, CardHeader, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { formatDate, formatUsd } from '/src/lib/format.js'
import { openCheckout } from '/src/lib/paddle.js'
import { useDocumentTitle } from '/src/lib/useDocumentTitle.js'
import styles from './billing.module.css'

/** How long to keep polling `billing/me` after the gateway reports success. */
const POLL_DURATION_MS = 2 * 60 * 1000
const POLL_INTERVAL_MS = 5000

/** Status-specific copy for the plan card. Colour alone never carries the meaning. */
const STATUS_COPY = {
  none: {
    badge: 'Free',
    tone: 'neutral',
    title: 'Free plan',
    subtitle: (data) =>
      `${data.freeLiveTournaments} free live tournament at a time. Subscribe to run as many as you like.`,
  },
  active: {
    badge: 'Active',
    tone: 'success',
    title: (data) => `${data.plan.name} plan`,
    subtitle: (data) =>
      data.renewsAt ? `Renews ${formatDate(data.renewsAt)}.` : 'Active — no live-tournament limit.',
  },
  past_due: {
    badge: 'Payment issue',
    tone: 'warning',
    title: (data) => `${data.plan.name} plan`,
    subtitle: () =>
      'Your last payment failed. Your tournaments stay live while the gateway retries the charge — update your card with the payment provider to avoid interruption.',
  },
  canceled: {
    badge: 'Canceled',
    tone: 'neutral',
    title: 'Plan canceled',
    subtitle: (data) =>
      `Your subscription has ended. ${data.freeLiveTournaments} free live tournament at a time, or subscribe again for unlimited.`,
  },
}

/**
 * The hosting subscription.
 *
 * One query answers the whole screen and the publish button both draw from —
 * how many tournaments are live, how many are free, and whether a plan lifts
 * that limit — so the two can never disagree about what this account may do.
 */
export function BillingPage() {
  useDocumentTitle('Billing')
  const queryClient = useQueryClient()
  const pollDeadline = useRef(null)

  const billing = useQuery({
    queryKey: billingKeys.me,
    queryFn: getMyBilling,
    select: (data) => data.billing,
    refetchInterval: (query) => {
      if (!pollDeadline.current) return false
      if (query.state.data?.billing?.status === 'active' || Date.now() > pollDeadline.current) {
        pollDeadline.current = null
        return false
      }
      return POLL_INTERVAL_MS
    },
  })

  const subscribe = useMutation({
    mutationFn: startCheckout,
    onSuccess: ({ checkout }) => {
      const gateway = billing.data?.gateway
      if (!gateway) return
      openCheckout({
        transactionId: checkout.transactionId,
        clientToken: gateway.clientToken,
        environment: gateway.environment,
        onPaid: () => {
          toast.success('Payment received — your plan activates within a minute')
          pollDeadline.current = Date.now() + POLL_DURATION_MS
          queryClient.invalidateQueries({ queryKey: billingKeys.me })
          queryClient.invalidateQueries({ queryKey: currentUserKey })
        },
      })
    },
    onError: (error) => {
      if (error.code === 'PAYMENTS_UNAVAILABLE') {
        toast.error('Card payments are not available on this deployment right now.')
      } else {
        toast.error(error.message)
      }
    },
  })

  if (billing.isPending) {
    return (
      <PageShell width="narrow">
        <LoadingState label="Loading your plan" rows={3} />
      </PageShell>
    )
  }

  if (billing.isError) {
    return (
      <PageShell width="narrow">
        <ErrorState
          title="Could not load your plan"
          error={billing.error}
          onRetry={() => billing.refetch()}
        />
      </PageShell>
    )
  }

  const data = billing.data
  const { active, status, plan, liveTournaments, freeLiveTournaments, gateway, contactEmail } = data
  const copy = STATUS_COPY[status] ?? STATUS_COPY.none

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Billing"
        title="Hosting plan"
        description="How many tournaments you can have live at once, and what lifts that limit."
      />

      <Card>
        <CardHeader
          title={typeof copy.title === 'function' ? copy.title(data) : copy.title}
          subtitle={copy.subtitle(data)}
          actions={<Badge tone={copy.tone}>{copy.badge}</Badge>}
        />

        <p className={styles.usage} aria-live="polite">
          <strong>{liveTournaments}</strong> of{' '}
          <strong>{active ? 'unlimited' : freeLiveTournaments}</strong> live tournaments in use
        </p>

        {!active && (
          <div className={styles.actions}>
            {gateway ? (
              <Button variant="primary" onClick={() => subscribe.mutate()} loading={subscribe.isPending}>
                Subscribe — {formatUsd(plan.priceCents)}/{plan.interval}
              </Button>
            ) : (
              <p className={styles.hint}>
                Card payments are not available on this deployment. Email{' '}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a> to subscribe.
              </p>
            )}
          </div>
        )}
      </Card>

      <p className={styles.hint}>
        Cancel any time. See the <a href="/refunds">refund policy</a> for details.
      </p>
    </PageShell>
  )
}
