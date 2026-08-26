import { Link } from 'react-router-dom'
import { CategoryArt } from '/src/components/brand/index.js'
import { Badge } from '/src/components/ui/index.js'
import {
  formatCapacity,
  formatCredits,
  formatDate,
  formatType,
  tournamentStatus,
} from '/src/lib/format.js'
import styles from './TournamentCard.module.css'

/**
 * One tournament in a list.
 *
 * The whole card is a link, with the title carrying the accessible name — so a
 * screen-reader user hears "Solo Ladder Open, link" rather than one anonymous
 * link per line of metadata.
 */
export function TournamentCard({ tournament }) {
  const status = tournamentStatus(tournament)

  return (
    <article className={styles.card}>
      <div className={styles.art}>
        <CategoryArt slug={tournament.category} />
      </div>

      <div className={styles.body}>
        <div className={styles.badges}>
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge>{formatType(tournament.type)}</Badge>
          {tournament.teamSize > 1 && <Badge>Teams of {tournament.teamSize}</Badge>}
          {tournament.accessibility === 'application required' && <Badge>Application</Badge>}
        </div>

        <h3 className={styles.title}>
          <Link to={`/tournament/${tournament.id}`}>{tournament.title}</Link>
        </h3>

        <dl className={styles.facts}>
          <div className={styles.prize}>
            <dt>Prize pool</dt>
            <dd>{formatCredits(tournament.totalPrize)}</dd>
          </div>
          <div>
            <dt>Entry</dt>
            <dd>{formatCredits(tournament.entryFee)}</dd>
          </div>
          <div>
            <dt>Entrants</dt>
            <dd>{formatCapacity(tournament)}</dd>
          </div>
          <div>
            <dt>Starts</dt>
            <dd>{formatDate(tournament.startDate)}</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}
