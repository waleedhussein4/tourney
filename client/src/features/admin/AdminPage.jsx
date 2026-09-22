import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  clearDemoData,
  deleteAnyTournament,
  listReports,
  seedDemoData,
  suspendUser,
  unpublishAnyTournament,
} from '/src/api/admin.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
} from '/src/components/ui/index.js'
import { ReasonDialog } from '/src/features/tournaments/ReasonDialog.jsx'
import { formatDateTime } from '/src/lib/format.js'
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

      <ModerationQueue />

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

/**
 * The moderation queue: every open report, and the action it leads to.
 *
 * A tournament report can be unpublished or deleted outright; a user report
 * can be suspended. Every action still asks for its own reason — the report's
 * reason is what someone else alleged, not necessarily why the admin acted.
 */
function ModerationQueue() {
  const queryClient = useQueryClient()
  const [acting, setActing] = useState(null)

  const reports = useQuery({ queryKey: ['admin', 'reports'], queryFn: listReports })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })

  const suspend = useMutation({
    mutationFn: ({ targetId, reason }) => suspendUser(targetId, reason),
    onSuccess: () => {
      toast.success('Account suspended')
      setActing(null)
      refresh()
    },
    onError: (error) => toast.error(error.message),
  })

  const unpublish = useMutation({
    mutationFn: ({ targetId, reason }) => unpublishAnyTournament(targetId, reason),
    onSuccess: () => {
      toast.success('Tournament unpublished')
      setActing(null)
      refresh()
    },
    onError: (error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: ({ targetId, reason }) => deleteAnyTournament(targetId, reason),
    onSuccess: () => {
      toast.success('Tournament deleted')
      setActing(null)
      refresh()
    },
    onError: (error) => toast.error(error.message),
  })

  const dialogFor = { suspend, unpublish, delete: remove }[acting?.action]

  return (
    <Card>
      <CardHeader title="Reports" subtitle="What members have flagged, newest first." />

      {reports.isPending && <LoadingState label="Loading reports" rows={3} />}

      {reports.isError && (
        <ErrorState
          title="Could not load reports"
          error={reports.error}
          onRetry={reports.refetch}
        />
      )}

      {reports.data && reports.data.reports.length === 0 && (
        <EmptyState title="Nothing reported" body="The queue is empty." />
      )}

      {reports.data && reports.data.reports.length > 0 && (
        <ul className={styles.reportList}>
          {reports.data.reports.map((report) => (
            <li key={report.id} className={styles.reportRow}>
              <div>
                <p className={styles.reportTarget}>
                  {report.targetType === 'tournament' ? 'Tournament' : 'User'}:{' '}
                  <strong>{report.targetName ?? report.targetId}</strong>
                </p>
                <p className={styles.reportMeta}>
                  Reported by {report.reporter.name ?? report.reporter.id} on{' '}
                  {formatDateTime(report.createdAt)}
                </p>
                <p>{report.reason}</p>
              </div>
              <div className={styles.reportActions}>
                {report.targetType === 'user' ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setActing({
                        action: 'suspend',
                        targetId: report.targetId,
                        name: report.targetName,
                      })
                    }
                  >
                    Suspend
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActing({
                          action: 'unpublish',
                          targetId: report.targetId,
                          name: report.targetName,
                        })
                      }
                    >
                      Unpublish
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        setActing({
                          action: 'delete',
                          targetId: report.targetId,
                          name: report.targetName,
                        })
                      }
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReasonDialog
        open={Boolean(acting)}
        onClose={() => setActing(null)}
        title={acting ? `${acting.action} ${acting.name ?? ''}` : 'Take action'}
        description="This is recorded in the moderation log."
        label="Reason"
        confirmLabel="Confirm"
        destructive
        submitting={dialogFor?.isPending}
        onSubmit={(reason) => dialogFor?.mutate({ targetId: acting.targetId, reason })}
      />
    </Card>
  )
}
