import { useEffect, useState } from 'react'
import { saveMatches } from '/src/api/tournaments.js'
import { Button, Card, CardHeader, EmptyState } from '/src/components/ui/index.js'
import { buildRounds } from '/src/features/tournaments/brackets/buildRounds.js'
import { useManageMutation } from '../useManageMutation.js'
import styles from '../ManagePage.module.css'

/** The current winner draft, by match id. */
function draftFrom(tournament) {
  return Object.fromEntries((tournament.matches ?? []).map((match) => [match.id, match.winner]))
}

/**
 * Recording who won each match.
 *
 * Every winner is chosen from the two competitors actually in that match, so an
 * invalid result cannot be entered. The original asked for the winner's name
 * through `window.prompt` and accepted any username on the site — the server now
 * rejects that too, but the host should never have been able to type it.
 */
export function MatchesSection({ tournament }) {
  const [draft, setDraft] = useState(() => draftFrom(tournament))

  useEffect(() => {
    setDraft(draftFrom(tournament))
    // Only the matches themselves should reset the draft — not every prop
    // change on `tournament` (score edits elsewhere on the page, etc).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament.matches])

  const dirty = Object.entries(draft).some(
    ([id, winner]) => winner !== (tournament.matches ?? []).find((match) => match.id === id)?.winner
  )

  const save = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () =>
      saveMatches(
        tournament.id,
        Object.entries(draft).map(([id, winner]) => ({ id, winner }))
      ),
    success: 'Results saved',
  })

  if (!tournament.hasStarted) {
    return (
      <Card>
        <CardHeader title="Results" />
        <EmptyState
          title="The bracket is not running yet"
          body="Once the tournament starts, each match appears here with its two competitors to choose between."
        />
      </Card>
    )
  }

  // Rounds are rebuilt with the draft overlaid, so choosing a winner immediately
  // shows them in the next round rather than after a save.
  const rounds = buildRounds(tournament, draft)

  const setWinner = (matchId, participantId) =>
    setDraft((current) => ({ ...current, [matchId]: participantId }))

  return (
    <Card>
      <CardHeader
        title="Results"
        subtitle="Pick the winner of each match. The next round fills in as you go."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => save.mutate()}
            loading={save.isPending}
            disabled={!dirty || tournament.hasEnded}
          >
            Save results
          </Button>
        }
      />

      <div className={styles.matches}>
        {rounds.map((round) => (
          <section key={round.title} className={styles.round}>
            <h4 className={styles.roundTitle}>{round.title}</h4>

            {round.seeds.map((seed) => {
              const [home, away] = seed.teams
              const playable = home.name && away.name

              return (
                <fieldset
                  key={seed.id}
                  className={styles.match}
                  disabled={!playable || tournament.hasEnded}
                >
                  <legend className="visually-hidden">
                    {playable ? `${home.name} against ${away.name}` : 'Match not ready'}
                  </legend>

                  {playable ? (
                    [home, away].map((competitor) => (
                      <label key={competitor.id} className={styles.option}>
                        <input
                          type="radio"
                          name={`match-${seed.id}`}
                          checked={draft[seed.id] === competitor.id}
                          onChange={() => setWinner(seed.id, competitor.id)}
                        />
                        <span>{competitor.name}</span>
                      </label>
                    ))
                  ) : (
                    <p className={styles.pending}>Waiting on the previous round</p>
                  )}

                  {playable && draft[seed.id] && (
                    <button
                      type="button"
                      className={styles.clear}
                      onClick={() => setWinner(seed.id, null)}
                    >
                      Clear
                    </button>
                  )}
                </fieldset>
              )
            })}
          </section>
        ))}
      </div>
    </Card>
  )
}
