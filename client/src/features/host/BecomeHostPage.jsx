import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { becomeHost } from '/src/api/users.js'
import { currentUserKey } from '/src/features/auth/queries.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, Card } from '/src/components/ui/index.js'
import { useDocumentTitle } from '/src/lib/useDocumentTitle.js'
import styles from './become-host.module.css'

export function BecomeHostPage() {
  useDocumentTitle('Become a host')
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const upgrade = useMutation({
    mutationFn: becomeHost,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: currentUserKey })
      await refresh()
      toast.success('You are a host now')
      navigate('/host')
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <PageShell width="narrow">
      <Card className={styles.card}>
        <h1>Become a host</h1>
        <p className={styles.lead}>
          Hosting lets you create tournaments, review applications, and record the results. It is
          free to become a host.
        </p>

        <ul className={styles.list}>
          <li>Run brackets or battle royales, solo or in teams</li>
          <li>Open-join or application-gated entry</li>
          <li>One tournament is free to run at a time; a monthly subscription lifts that limit</li>
        </ul>

        <Button variant="primary" onClick={() => upgrade.mutate()} loading={upgrade.isPending}>
          Become a host
        </Button>
      </Card>
    </PageShell>
  )
}
