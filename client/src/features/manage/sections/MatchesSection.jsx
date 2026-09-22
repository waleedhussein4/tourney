import { useEffect, useState } from 'react'
import { saveMatches, scheduleMatches } from '/src/api/tournaments.js'
import { Button, Card, CardHeader, EmptyState } from '/src/components/ui/index.js'
import { localInputToUtcIso, utcToLocalInput } from '/src/lib/format.js'
import { buildRounds } from '/src/features/tournaments/brackets/buildRounds.js'
import { useManageMutation } from '../useManageMutation.js'
import styles from '../ManagePage.module.css'

/** The current winner draft, by match id. */
function draftFrom(tournament) {
  return Object.fromEntries((tournament.matches ?? []).map((match) => [match.id, match.winner]))
}

/** The current schedule draft, by match id — a `datetime-local` value in the viewer's own zone. */
function scheduleDraftFrom(tournament) {
  return Object.fromEntries(
    (tournament.matches ?? []).map((match) => [match.id, utcToLocalInput(match.scheduledAt)])
  )
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
  const [scheduleDraft, setScheduleDraft] = useState(() => scheduleDraftFrom(tournament))
  const [roundTimeDraft, setRoundTimeDraft] = useState({})

  useEffect(() => {
    setDraft(draftFrom(tournament))
    setScheduleDraft(scheduleDraftFrom(tournament))
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

  const scheduleDirty = Object.entries(scheduleDraft).some(([id, value]) => {
    const match = (tournament.matches ?? []).find((entry) => entry.id === id)
    return value && localInputToUtcIso(value) !== (match?.scheduledAt ?? null)
  })

  const saveSchedule = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () =>
      scheduleMatches(
        tournament.id,
        Object.entries(scheduleDraft)
          .filter(([id, value]) => {
            const match = (tournament.matches ?? []).find((entry) => entry.id === id)
            return value && localInputToUtcIso(value) !== (match?.scheduledAt ?? null)
          })
          .map(([id, value]) => ({ id, scheduledAt: localInputToUtcIso(value) }))
      ),
    success: 'Match times saved',
  })

  const setMatchTime = (matchId, value) =>
    setScheduleDraft((current) => ({ ...current, [matchId]: value }))

  const applyToRound = (matchIds, value) => {
    if (!value) return
    setScheduleDraft((current) => {
      const next = { ...current }
      for (const id of matchIds) next[id] = value
      return next
    })
  }

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
        subtitle="Pick the winner of each match, and set when each one is played. Times are shown in your own timezone."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveSchedule.mutate()}
              loading={saveSchedule.isPending}
              disabled={!scheduleDirty}
            >
              Save times
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => save.mutate()}
              loading={save.isPending}
              disabled={!dirty || tournament.hasEnded}
            >
              Save results
            </Button>
          </>
        }
      />

      <div className={styles.matches}>
        {rounds.map((round) => {
          const matchIds = round.seeds.map((seed) => seed.id)
          return (
            <section key={round.title} className={styles.round}>
              <h4 className={styles.roundTitle}>{round.title}</h4>

              <label className={styles.roundTime}>
                <span>Set the whole round</span>
                <input
                  type="datetime-local"
                  onChange={(event) => {
                    applyToRound(matchIds, event.target.value)
                    setRoundTimeDraft((current) => ({
                      ...current,
                      [round.title]: event.target.value,
                    }))
                  }}
                  value={roundTimeDraft[round.title] ?? ''}
                />
              </label>

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

                    <label className={styles.matchTime}>
                      <span>Match time</span>
                      <input
                        type="datetime-local"
                        value={scheduleDraft[seed.id] ?? ''}
                        onChange={(event) => setMatchTime(seed.id, event.target.value)}
                      />
                    </label>
                  </fieldset>
                )
              })}
            </section>
          )
        })}
      </div>
    </Card>
  )
}
