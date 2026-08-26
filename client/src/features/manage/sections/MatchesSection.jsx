import { useEffect, useState } from 'react'
import { saveMatches } from '/src/api/tournaments.js'
import { Button, Card, CardHeader, EmptyState } from '/src/components/ui/index.js'
import { buildRounds } from '/src/features/tournaments/brackets/buildRounds.js'
import { useManageMutation } from '../useManageMutation.js'

/**
 * Recording who won each match.
 *
 * Every winner is chosen from the two competitors actually in that match, so an
 * invalid result cannot be entered. The original asked for the winner's name
 * through `window.prompt` and accepted any username on the site — the server now
 * rejects that too, but the host should never have been able to type it.
 */
export function MatchesSection({ tournament }) {
  const [draft, setDraft] = useState(() => [...tournament.matches])

  useEffect(() => {
    setDraft([...tournament.matches])
  }, [tournament.matches])

  const save = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () => saveMatches(tournament.id, draft),
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

  // Rounds are rebuilt from the draft, so choosing a winner immediately shows
  // them in the next round rather than after a save.
  const rounds = buildRounds({ ...tournament, matches: draft })
  const dirty = draft.some((value, index) => value !== tournament.matches[index])

  const setWinner = (matchIndex, participantId) =>
    setDraft((current) =>
      current.map((value, index) => (index === matchIndex ? participantId : value))
    )

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

      <div className="matches">
        {rounds.map((round) => (
          <section key={round.title} className="matches__round">
            <h4 className="matches__round-title">{round.title}</h4>

            {round.seeds.map((seed) => {
              const [home, away] = seed.teams
              const playable = home.name && away.name

              return (
                <fieldset
                  key={seed.id}
                  className="matches__match"
                  disabled={!playable || tournament.hasEnded}
                >
                  <legend className="visually-hidden">
                    {playable ? `${home.name} against ${away.name}` : 'Match not ready'}
                  </legend>

                  {playable ? (
                    [home, away].map((competitor) => (
                      <label key={competitor.id} className="matches__option">
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
                    <p className="matches__pending">Waiting on the previous round</p>
                  )}

                  {playable && draft[seed.id] && (
                    <button
                      type="button"
                      className="matches__clear"
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
