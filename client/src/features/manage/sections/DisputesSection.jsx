import { useForm } from 'react-hook-form'
import { resolveMatch } from '/src/api/tournaments.js'
import { Button, Card, CardHeader, Field, Input } from '/src/components/ui/index.js'
import { useManageMutation } from '../useManageMutation.js'
import styles from '../ManagePage.module.css'

/** One disputed match: both competitors' reported scores, and a form to settle it. */
function DisputedMatch({ tournament, match, names }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      home: match.scores[0] ?? '',
      away: match.scores[1] ?? '',
    },
  })

  const resolve = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: (values) =>
      resolveMatch(tournament.id, match.id, {
        scores: match.participants.map((participantId, index) => ({
          participantId,
          score: index === 0 ? values.home : values.away,
        })),
      }),
    success: 'Dispute resolved',
  })

  const [homeId, awayId] = match.participants
  const [homeScore, awayScore] = match.scores

  return (
    <form className={styles.fieldset} onSubmit={handleSubmit((values) => resolve.mutate(values))}>
      <p>
        Round {match.round}: <strong>{names.get(homeId) ?? 'Unknown'}</strong> reported {homeScore}{' '}
        – {awayScore} against <strong>{names.get(awayId) ?? 'Unknown'}</strong>
      </p>

      <div className={styles.grid}>
        <Field label={names.get(homeId) ?? 'Home'} error={errors.home?.message}>
          {(field) => (
            <Input
              {...field}
              type="number"
              {...register('home', { required: 'Enter a score', valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label={names.get(awayId) ?? 'Away'} error={errors.away?.message}>
          {(field) => (
            <Input
              {...field}
              type="number"
              {...register('away', { required: 'Enter a score', valueAsNumber: true })}
            />
          )}
        </Field>
      </div>

      <Button type="submit" variant="primary" size="sm" loading={resolve.isPending}>
        Resolve
      </Button>
    </form>
  )
}

/** Matches the two competitors disagreed on, surfaced so the host can settle them. */
export function DisputesSection({ tournament }) {
  const disputed = (tournament.matches ?? []).filter((match) => match.state === 'disputed')
  const names = new Map(
    tournament.participants.map((participant) => [participant.id, participant.name])
  )

  if (disputed.length === 0) return null

  return (
    <Card>
      <CardHeader
        title="Disputed matches"
        subtitle="The two competitors reported different results. Enter the final score to settle it."
      />
      <div className={styles.matches}>
        {disputed.map((match) => (
          <DisputedMatch key={match.id} tournament={tournament} match={match} names={names} />
        ))}
      </div>
    </Card>
  )
}
