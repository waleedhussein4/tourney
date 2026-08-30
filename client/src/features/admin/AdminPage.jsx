import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { clearDemoData, seedDemoData } from '/src/api/admin.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, Card, CardHeader, ConfirmDialog } from '/src/components/ui/index.js'
import styles from './admin.module.css'

/**
 * The demo-data page.
 *
 * Unlisted and admin-gated. It exists so the live demo can be reset to something
 * worth looking at without touching the database directly.
 */
export function AdminPage() {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState(null)

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
        title="Demo data"
        description="Reset the demo to a database worth showing someone."
      />

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
