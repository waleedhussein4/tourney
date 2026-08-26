import { useEffect, useState } from 'react'
import { saveParticipants } from '/src/api/tournaments.js'
import { Button, Card, CardHeader, EmptyState, Input } from '/src/components/ui/index.js'
import { useManageMutation } from '../useManageMutation.js'

function toDraft(participants) {
  return Object.fromEntries(
    participants.map((participant) => [
      participant.id,
      {
        score: participant.score ?? 0,
        eliminated: Boolean(participant.eliminated),
      },
    ])
  )
}

/**
 * Scores and eliminations.
 *
 * Edited in place in a table and saved together, rather than through a
 * `window.prompt` for the score followed by a `window.confirm` for whether the
 * player was out — which is how the original asked, one competitor at a time.
 */
export function ParticipantsSection({ tournament }) {
  const [draft, setDraft] = useState(() => toDraft(tournament.participants))

  // The server is the source of truth. When another action refetches the
  // tournament, the table follows rather than holding a stale local copy.
  useEffect(() => {
    setDraft(toDraft(tournament.participants))
  }, [tournament.participants])

  const save = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: () =>
      saveParticipants(
        tournament.id,
        Object.entries(draft).map(([id, entry]) => ({
          id,
          score: Number(entry.score) || 0,
          eliminated: entry.eliminated,
        }))
      ),
    success: 'Scores saved',
  })

  if (tournament.participants.length === 0) {
    return (
      <Card>
        <CardHeader title="Participants" />
        <EmptyState
          title="Nobody has entered yet"
          body="Share the tournament link and entrants will appear here."
        />
      </Card>
    )
  }

  const editable = tournament.hasStarted && !tournament.hasEnded
  const isTeamBased = tournament.teamSize > 1

  const update = (id, changes) =>
    setDraft((current) => ({ ...current, [id]: { ...current[id], ...changes } }))

  return (
    <Card>
      <CardHeader
        title="Participants"
        subtitle={
          editable
            ? 'Set scores and mark who is out. Saved together.'
            : tournament.hasEnded
              ? 'Final standings.'
              : 'Scores can be edited once the tournament starts.'
        }
        actions={
          editable && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => save.mutate()}
              loading={save.isPending}
            >
              Save scores
            </Button>
          )
        }
      />

      <table className="manage__table">
        <thead>
          <tr>
            <th scope="col">{isTeamBased ? 'Team' : 'Player'}</th>
            <th scope="col">Score</th>
            <th scope="col">Eliminated</th>
          </tr>
        </thead>
        <tbody>
          {tournament.participants.map((participant) => (
            <tr key={participant.id}>
              <th scope="row">
                {participant.name}
                {isTeamBased && (
                  <span className="manage__roster">
                    {(participant.members ?? []).map((member) => member.name).join(', ')}
                  </span>
                )}
              </th>
              <td>
                <label className="visually-hidden" htmlFor={`score-${participant.id}`}>
                  Score for {participant.name}
                </label>
                <Input
                  id={`score-${participant.id}`}
                  className="manage__number"
                  type="number"
                  disabled={!editable}
                  value={draft[participant.id]?.score ?? 0}
                  onChange={(event) => update(participant.id, { score: event.target.value })}
                />
              </td>
              <td>
                <label className="visually-hidden" htmlFor={`out-${participant.id}`}>
                  {participant.name} is eliminated
                </label>
                <input
                  id={`out-${participant.id}`}
                  type="checkbox"
                  disabled={!editable}
                  checked={draft[participant.id]?.eliminated ?? false}
                  onChange={(event) => update(participant.id, { eliminated: event.target.checked })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
