import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { billingKeys, getMyBilling, startCheckout } from '/src/api/billing.js'
import { currentUserKey } from '/src/features/auth/queries.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Badge, Button, Card, CardHeader, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { formatDate, formatUsd } from '/src/lib/format.js'
import { openCheckout } from '/src/lib/paddle.js'
import styles from './billing.module.css'

/**
 * The hosting subscription.
 *
 * One query answers the whole screen and the publish button both draw from —
 * how many tournaments are live, how many are free, and whether a plan lifts
 * that limit — so the two can never disagree about what this account may do.
 */
export function BillingPage() {
  const queryClient = useQueryClient()

  const billing = useQuery({
    queryKey: billingKeys.me,
    queryFn: getMyBilling,
    select: (data) => data.billing,
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
          toast.success('Payment received — your plan updates itself shortly')
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: billingKeys.me })
            queryClient.invalidateQueries({ queryKey: currentUserKey })
          }, 2500)
        },
      })
    },
    onError: (error) => toast.error(error.message),
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
  const { active, plan, liveTournaments, freeLiveTournaments, gateway, contactEmail } = data

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Billing"
        title="Hosting plan"
        description="How many tournaments you can have live at once, and what lifts that limit."
      />

      <Card>
        <CardHeader
          title={active ? `${plan.name} plan` : 'Free plan'}
          subtitle={
            active
              ? data.renewsAt
                ? `Renews ${formatDate(data.renewsAt)}.`
                : 'Active — no live-tournament limit.'
              : `${freeLiveTournaments} free live tournament at a time. Subscribe to run as many as you like.`
          }
          actions={<Badge tone={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Free'}</Badge>}
        />

        <p className={styles.usage}>
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
                Card payments are not available right now. Email{' '}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a> to subscribe.
              </p>
            )}
          </div>
        )}
      </Card>
    </PageShell>
  )
}
