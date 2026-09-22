import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  cancelTournament,
  endTournament,
  shuffleBracket,
  startTournament,
} from '/src/api/tournaments.js'
import { Button, Card, CardHeader, ConfirmDialog } from '/src/components/ui/index.js'
import { useManageMutation } from '../useManageMutation.js'
import styles from '../ManagePage.module.css'

/**
 * Starting, ending, and cancelling.
 *
 * Each button says what is stopping it rather than being silently disabled, so
 * a host can see what to fix. The server enforces all of it regardless; this is
 * about not making them guess.
 */
export function LifecycleSection({ tournament }) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(null)

  const entrants = tournament.participants.length
  const bracketUnfilled = tournament.type === 'brackets' && entrants < tournament.maxCapacity
  const tooFewEntrants = tournament.type !== 'brackets' && entrants < 2
  const finalUndecided =
    tournament.type === 'brackets' && !tournament.matches[tournament.matches.length - 1]

  const start = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () => startTournament(tournament.id),
    success: 'Tournament started',
    onDone: () => setConfirming(null),
  })

  const end = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () => endTournament(tournament.id),
    success: 'Tournament ended and winners recorded',
    onDone: () => setConfirming(null),
  })

  const shuffle = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () => shuffleBracket(tournament.id),
    success: 'Bracket redrawn',
  })

  const cancel = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () => cancelTournament(tournament.id),
    success: 'Tournament cancelled',
    onDone: () => navigate('/tournaments'),
  })

  const published = tournament.publishState === 'published'

  const blockers = [
    !published && 'it has not been published yet',
    bracketUnfilled &&
      `${entrants} of ${tournament.maxCapacity} slots are filled — a bracket starts full`,
    tooFewEntrants && 'it needs at least two entrants',
  ].filter(Boolean)

  if (tournament.hasEnded) {
    return (
      <Card>
        <CardHeader
          title="Finished"
          subtitle="Winners have been recorded. Nothing further to do."
        />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title={tournament.hasStarted ? 'Running' : 'Not started yet'}
        subtitle={
          tournament.hasStarted
            ? 'Record the results, then end it to lock in the winners.'
            : published
              ? 'Entrants can still join, and you can still edit the details.'
              : 'Nobody can find or join it until it is published. You can still edit everything.'
        }
      />

      {!tournament.hasStarted && blockers.length > 0 && (
        <p className={styles.blockers}>Before you can start: {blockers.join('; ')}.</p>
      )}

      <div className={styles.actions}>
        {tournament.hasStarted ? (
          <Button
            variant="primary"
            onClick={() => setConfirming('end')}
            disabled={finalUndecided}
            loading={end.isPending}
          >
            End tournament
          </Button>
        ) : (
          <>
            <Button
              variant="primary"
              onClick={() => setConfirming('start')}
              disabled={blockers.length > 0}
              loading={start.isPending}
            >
              Start tournament
            </Button>
            {tournament.type === 'brackets' && (
              <Button onClick={() => shuffle.mutate()} loading={shuffle.isPending}>
                {tournament.bracketsShuffled ? 'Redraw bracket' : 'Draw bracket'}
              </Button>
            )}
            <Button variant="danger" onClick={() => setConfirming('cancel')}>
              Cancel tournament
            </Button>
          </>
        )}
      </div>

      {finalUndecided && tournament.hasStarted && (
        <p className={styles.hint}>Record the winner of the final before ending.</p>
      )}

      <ConfirmDialog
        open={confirming === 'start'}
        onClose={() => setConfirming(null)}
        onConfirm={() => start.mutate()}
        loading={start.isPending}
        title="Start this tournament?"
        description="Entries close and the bracket is locked. You cannot undo this."
        confirmLabel="Start"
      />

      <ConfirmDialog
        open={confirming === 'end'}
        onClose={() => setConfirming(null)}
        onConfirm={() => end.mutate()}
        loading={end.isPending}
        title="End this tournament?"
        description="The winners are recorded and the tournament is marked finished. This cannot be undone."
        confirmLabel="End tournament"
      />

      <ConfirmDialog
        open={confirming === 'cancel'}
        onClose={() => setConfirming(null)}
        onConfirm={() => cancel.mutate()}
        loading={cancel.isPending}
        destructive
        title="Cancel this tournament?"
        description="The tournament is deleted. This cannot be undone."
        confirmLabel="Cancel it"
        cancelLabel="Keep it"
      />
    </Card>
  )
}
