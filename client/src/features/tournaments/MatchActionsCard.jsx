import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { confirmMatch, reportMatch, tournamentKeys } from '/src/api/tournaments.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { Button, Card, Field, Input } from '/src/components/ui/index.js'
import { formatMatchTime } from '/src/lib/format.js'
import styles from './MatchActionsCard.module.css'

/** The participant id (user id, or team id for a team tournament) the viewer competes under. */
function myCompetitorId(tournament, userId) {
  if (!userId) return null
  const mine = tournament.participants.find((participant) => {
    if (participant.id === userId) return true
    return (participant.members ?? []).some((member) => member.id === userId)
  })
  return mine?.id ?? null
}

/**
 * Report/confirm forms for the matches the signed-in visitor is competing in.
 *
 * Only shown once the bracket is under way — a match with an empty slot has
 * nothing to report yet, which the server also guards.
 */
export function MatchActionsCard({ tournament }) {
  const { user } = useAuth()
  const myId = myCompetitorId(tournament, user?.id)

  if (tournament.type !== 'brackets' || !tournament.hasStarted || !myId) return null

  const names = new Map(tournament.participants.map((entry) => [entry.id, entry.name]))
  const myMatches = tournament.matches.filter(
    (match) => match.participants.includes(myId) && match.state !== 'final'
  )

  if (myMatches.length === 0) return null

  return (
    <Card>
      <h2 className={styles.title}>Your matches</h2>
      <ul className={styles.list}>
        {myMatches.map((match) => (
          <li key={match.id}>
            <MatchAction tournament={tournament} match={match} myId={myId} names={names} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function MatchAction({ tournament, match, myId, names }) {
  if (match.participants.includes(null)) return null

  const scheduled = match.scheduledAt && (
    <p className={styles.note}>Scheduled for {formatMatchTime(match.scheduledAt)}</p>
  )

  if (match.state === 'reported') {
    if (match.reportedBy === myId) {
      return (
        <>
          {scheduled}
          <p className={styles.note}>Reported — waiting on your opponent to confirm.</p>
        </>
      )
    }
    return (
      <>
        {scheduled}
        <ConfirmForm tournament={tournament} match={match} names={names} />
      </>
    )
  }

  return (
    <>
      {scheduled}
      <ReportForm tournament={tournament} match={match} names={names} />
    </>
  )
}

function ReportForm({ tournament, match, names }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit } = useForm()

  const report = useMutation({
    mutationFn: (values) =>
      reportMatch(tournament.id, match.id, {
        scores: match.participants.map((id) => ({
          participantId: id,
          score: Number(values[id]),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournament.id) })
      toast.success('Result reported — waiting on your opponent to confirm')
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <form className={styles.form} onSubmit={handleSubmit((values) => report.mutate(values))}>
      {match.state === 'disputed' && (
        <p className={styles.note}>The last report was disputed — report the result again.</p>
      )}
      {match.participants.map((id) => (
        <Field key={id} label={names.get(id) ?? id} required>
          {(field) => (
            <Input
              {...field}
              type="number"
              step="any"
              {...register(id, { required: true, valueAsNumber: true })}
            />
          )}
        </Field>
      ))}
      <Button type="submit" variant="primary" loading={report.isPending}>
        Report result
      </Button>
    </form>
  )
}

function ConfirmForm({ tournament, match, names }) {
  const queryClient = useQueryClient()

  const confirm = useMutation({
    mutationFn: (agree) => confirmMatch(tournament.id, match.id, agree),
    onSuccess: (_, agree) => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournament.id) })
      toast.success(agree ? 'Result confirmed' : 'Result disputed')
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className={styles.form}>
      <p>
        {names.get(match.winner) ?? match.winner} reported as the winner
        {match.scores.length === 2 && (
          <>
            {' '}
            ({match.scores[0]}–{match.scores[1]})
          </>
        )}
        .
      </p>
      <div className={styles.actions}>
        <Button variant="primary" onClick={() => confirm.mutate(true)} loading={confirm.isPending}>
          Confirm
        </Button>
        <Button variant="ghost" onClick={() => confirm.mutate(false)} loading={confirm.isPending}>
          Dispute
        </Button>
      </div>
    </div>
  )
}
