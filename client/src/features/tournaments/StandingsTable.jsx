import { Badge, EmptyState } from '/src/components/ui/index.js'
import styles from './StandingsTable.module.css'

/**
 * The battle-royale leaderboard.
 *
 * Sorted by score, highest first.
 *
 * The sort copies the array first. The original called `.sort()` on the array it
 * received as a prop, which reorders the caller's data as a side effect of
 * rendering.
 */
export function StandingsTable({ tournament, onReportParticipant }) {
  const participants = tournament.participants ?? []

  if (participants.length === 0) {
    return (
      <EmptyState
        title="Nobody has entered yet"
        body="Standings appear here once players join and the host records scores."
      />
    )
  }

  const standings = [...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const isTeamBased = tournament.teamSize > 1

  return (
    <div className={styles.standings}>
      <table className={styles.table}>
        <caption className="visually-hidden">
          Standings, ordered by score. {standings.length} entrants.
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.rank}>
              #
            </th>
            <th scope="col">{isTeamBased ? 'Team' : 'Player'}</th>
            <th scope="col" className={styles.number}>
              Score
            </th>
            <th scope="col">Status</th>
            {onReportParticipant && (
              <th scope="col" className="visually-hidden">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {standings.map((participant, index) => {
            const rank = index + 1

            return (
              <tr key={participant.id} className={participant.eliminated ? styles.out : ''}>
                <td className={`${styles.rank} ${rank <= 3 ? styles.podium : ''}`}>{rank}</td>
                <td>
                  <span className={styles.name}>{participant.name}</span>
                  {isTeamBased && participant.members?.length > 0 && (
                    <span className={styles.roster}>
                      {participant.members.map((member) => member.name).join(', ')}
                    </span>
                  )}
                </td>
                <td className={styles.number}>{participant.score ?? 0}</td>
                <td>
                  {participant.eliminated ? (
                    <Badge tone="danger">Out</Badge>
                  ) : (
                    <Badge tone="success">In</Badge>
                  )}
                </td>
                {onReportParticipant && (
                  <td>
                    <button
                      type="button"
                      className={styles.reportButton}
                      onClick={() =>
                        onReportParticipant({ id: participant.id, name: participant.name })
                      }
                    >
                      Report
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
