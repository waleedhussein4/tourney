import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  clearDemoData,
  listPublishRequests,
  publishRequestKeys,
  seedDemoData,
} from '/src/api/admin.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, ButtonLink, Card, CardHeader, ConfirmDialog } from '/src/components/ui/index.js'
import styles from './admin.module.css'

/**
 * The administrator's landing page.
 *
 * Unlisted and admin-gated. Publishing payments come first because a host is
 * waiting on each one; the demo-data controls below it are housekeeping.
 */
export function AdminPage() {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState(null)

  // Cheap, and the only place anyone would notice a host is waiting to be paid
  // attention to. Failure is silent on purpose: this card is a signpost, and the
  // queue page reports its own errors properly.
  const pending = useQuery({
    queryKey: publishRequestKeys.pending,
    queryFn: listPublishRequests,
    select: (data) => data.requests.length,
  })

  const seed = useMutation({
    mutationFn: seedDemoData,
    onSuccess: (data) => {
      queryClient.invalidateQueries()
      setResult(`Seeded ${data.users} users, ${data.teams} teams, ${data.tournaments} tournaments.`)
      toast.success('Demo data seeded')
    },
    onError: (error) => toast.error(error.message),
  })

  const clear = useMutation({
    mutationFn: clearDemoData,
    onSuccess: (data) => {
      queryClient.invalidateQueries()
      setResult(
        `Cleared ${data.tournaments} tournaments, ${data.teams} teams, ${data.users} users, ${data.transactions} ledger rows.`
      )
      toast.success('Demo data cleared')
      setConfirming(false)
    },
    onError: (error) => {
      toast.error(error.message)
      setConfirming(false)
    },
  })

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Administration"
        title="Administration"
        description="Publishing payments waiting on a human, and the demo data behind the live site."
      />

      <Card>
        <CardHeader
          title="Publishing payments"
          subtitle={
            pending.data > 0
              ? `${pending.data} ${pending.data === 1 ? 'tournament is' : 'tournaments are'} waiting on a confirmed transfer.`
              : 'Tournaments whose hosts have paid to publish. Nothing is waiting right now.'
          }
          actions={
            <ButtonLink
              variant={pending.data > 0 ? 'primary' : 'secondary'}
              size="sm"
              to="/admin/publish-requests"
            >
              Open the queue
            </ButtonLink>
          }
        />
      </Card>

      <Card>
        <CardHeader
          title="Seed"
          subtitle="Adds the demo accounts, teams and tournaments. Safe to run twice — it only adds what is missing."
        />
        <Button variant="primary" onClick={() => seed.mutate()} loading={seed.isPending}>
          Seed demo data
        </Button>
      </Card>

      <Card>
        <CardHeader
          title="Clear"
          subtitle="Deletes every tournament, team, non-admin account and ledger row."
        />
        <Button variant="danger" onClick={() => setConfirming(true)} loading={clear.isPending}>
          Clear demo data
        </Button>
      </Card>

      {result && (
        <p className={styles.result} role="status">
          {result}
        </p>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => clear.mutate()}
        loading={clear.isPending}
        destructive
        title="Clear all demo data?"
        description="Every tournament, team, non-admin account and ledger row is deleted. Administrator accounts are kept. This cannot be undone."
        confirmLabel="Clear everything"
      />
    </PageShell>
  )
}
