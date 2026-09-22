import { Link } from 'react-router-dom'
import { publishTournament, unpublishTournament } from '/src/api/tournaments.js'
import { Button, Card, CardHeader } from '/src/components/ui/index.js'
import { useManageMutation } from '../useManageMutation.js'
import styles from '../ManagePage.module.css'

/**
 * Getting the tournament in front of people.
 *
 * A tournament is a draft until it is published, and a draft is visible to
 * nobody but its host. Publishing is free — what limits it is how many
 * tournaments this host already has live, which the free plan caps at one.
 */
export function PublishSection({ tournament }) {
  const { publishState } = tournament

  const publish = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () => publishTournament(tournament.id),
    success: 'Your tournament is live',
  })

  const unpublish = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () => unpublishTournament(tournament.id),
    success: 'Back to a draft — only you can see it now',
  })

  const limitReached = publish.error?.code === 'PLAN_LIMIT_REACHED'

  if (publishState === 'published') {
    return (
      <Card className={styles.publish}>
        <CardHeader
          title="Published"
          subtitle="Anyone can find and join this tournament."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => unpublish.mutate()}
              loading={unpublish.isPending}
            >
              Unpublish
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <Card className={styles.publish}>
      <CardHeader
        title="Publish this tournament"
        subtitle="Nobody can find or join it until you do. You can still edit everything."
      />

      {limitReached ? (
        <p className={styles.blockers}>
          {publish.error.message} <Link to="/billing">See billing</Link>
        </p>
      ) : (
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => publish.mutate()} loading={publish.isPending}>
            Publish now
          </Button>
        </div>
      )}
    </Card>
  )
}
