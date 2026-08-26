import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { becomeHost } from '/src/api/users.js'
import { currentUserKey } from '/src/features/auth/queries.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, Card, ConfirmDialog } from '/src/components/ui/index.js'
import { formatCredits } from '/src/lib/format.js'
import './become-host.css'

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
      <Card className="become-host">
        <h1>Become a host</h1>
        <p className="become-host__lead">
          Hosting lets you create tournaments, set the prizes, review applications, record the
          results, and pay out the winners.
        </p>

        <ul className="become-host__list">
          <li>Run brackets or battle royales, solo or in teams</li>
          <li>Set your own entry fees and prize table</li>
          <li>Keep whatever the entry fees raise above the prizes</li>
        </ul>

        <div className="become-host__price">
          <span>One-off cost</span>
          <strong>{formatCredits(PRICE)}</strong>
        </div>

        <p className="become-host__balance">You have {formatCredits(user?.credits ?? 0)}.</p>

        {canAfford ? (
          <Button variant="primary" onClick={() => setConfirming(true)} loading={upgrade.isPending}>
            Become a host for {formatCredits(PRICE)}
          </Button>
        ) : (
          <>
            <p className="become-host__short" role="alert">
              You need {formatCredits(PRICE - (user?.credits ?? 0))} more.
            </p>
            <Link className="btn btn--primary btn--md" to="/credits">
              Buy credits
            </Link>
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
