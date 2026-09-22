import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { clearDemoData, seedDemoData } from '/src/api/admin.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, Card, CardHeader, ConfirmDialog } from '/src/components/ui/index.js'
import { useDocumentTitle } from '/src/lib/useDocumentTitle.js'
import styles from './admin.module.css'

/**
 * The administrator's landing page.
 *
 * Unlisted and admin-gated. Just the demo data controls — publishing is now
 * gated by the subscription, which the payment gateway settles on its own.
 */
export function AdminPage() {
  useDocumentTitle('Admin')
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
        `Cleared ${data.tournaments} tournaments, ${data.teams} teams, ${data.users} users.`
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
        description="The demo data behind the live site."
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
          subtitle="Deletes every tournament, team and non-admin account."
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
        description="Every tournament, team and non-admin account is deleted. Administrator accounts are kept. This cannot be undone."
        confirmLabel="Clear everything"
      />
    </PageShell>
  )
}
