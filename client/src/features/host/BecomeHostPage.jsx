import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { becomeHost } from '/src/api/users.js'
import { currentUserKey } from '/src/features/auth/queries.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, ButtonLink, Card, ConfirmDialog } from '/src/components/ui/index.js'
import { formatCredits } from '/src/lib/format.js'
import styles from './become-host.module.css'

const PRICE = 20

export function BecomeHostPage() {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const upgrade = useMutation({
    mutationFn: becomeHost,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: currentUserKey })
      await refresh()
      toast.success('You are a host now')
      navigate('/host')
    },
    onError: (error) => {
      toast.error(error.message)
      setConfirming(false)
    },
  })

  const canAfford = (user?.credits ?? 0) >= PRICE

  return (
    <PageShell width="narrow">
      <Card className={styles.card}>
        <h1>Become a host</h1>
        <p className={styles.lead}>
          Hosting lets you create tournaments, set the prizes, review applications, record the
          results, and pay out the winners.
        </p>

        <ul className={styles.list}>
          <li>Run brackets or battle royales, solo or in teams</li>
          <li>Set your own entry fees and prize table</li>
          <li>Keep whatever the entry fees raise above the prizes</li>
        </ul>

        <div className={styles.price}>
          <span>One-off cost</span>
          <strong>{formatCredits(PRICE)}</strong>
        </div>

        <p className={styles.balance}>You have {formatCredits(user?.credits ?? 0)}.</p>

        {canAfford ? (
          <Button variant="primary" onClick={() => setConfirming(true)} loading={upgrade.isPending}>
            Become a host for {formatCredits(PRICE)}
          </Button>
        ) : (
          <>
            <p className={styles.short} role="alert">
              You need {formatCredits(PRICE - (user?.credits ?? 0))} more.
            </p>
            <ButtonLink variant="primary" to="/credits">
              Buy credits
            </ButtonLink>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => upgrade.mutate()}
        loading={upgrade.isPending}
        title={`Become a host for ${formatCredits(PRICE)}?`}
        description="The credits are taken now, and hosting is yours permanently."
        confirmLabel="Become a host"
      />
    </PageShell>
  )
}
