import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTournament, tournamentKeys } from '/src/api/tournaments.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { Badge, Button, Card, ErrorState, LoadingState } from '/src/components/ui/index.js'
import {
  formatCapacity,
  formatCategory,
  formatCredits,
  formatDateTime,
  formatType,
  tournamentStatus,
} from '/src/lib/format.js'
import { isEmptyRichText, toSafeHtml } from '/src/lib/richText.js'
import { BracketView } from './brackets/BracketView.jsx'
import { StandingsTable } from './StandingsTable.jsx'
import { EnterDialog } from './EnterDialog.jsx'
import './TournamentPage.css'

export function TournamentPage() {
  const { UUID: id } = useParams()
  const [entering, setEntering] = useState(null)

  const query = useQuery({
    queryKey: tournamentKeys.detail(id),
    queryFn: () => getTournament(id),
    enabled: Boolean(id),
  })

  if (query.isPending) {
    return (
      <PageShell>
        <LoadingState label="Loading tournament" rows={4} />
      </PageShell>
    )
  }

  if (query.isError) {
    return (
      <PageShell>
        <ErrorState
          title="Could not load this tournament"
          error={query.error}
          onRetry={() => query.refetch()}
          action={
            <Link className="btn btn--ghost btn--md" to="/tournaments">
              Back to browse
            </Link>
          }
        />
      </PageShell>
    )
  }

  const tournament = query.data.tournament
  const status = tournamentStatus({
    ...tournament,
    participantCount: tournament.participants.length,
  })
  const isTeamBased = tournament.teamSize > 1

  return (
    <PageShell width="wide">
      <header className="tp__header">
        <div className="tp__heading">
          <div className="tp__badges">
            <Badge tone={status.tone}>{status.label}</Badge>
            <Badge>{formatType(tournament.type)}</Badge>
            <Badge>{formatCategory(tournament.category)}</Badge>
            {isTeamBased && <Badge>Teams of {tournament.teamSize}</Badge>}
          </div>
          <h1>{tournament.title}</h1>
          <p className="tp__host">
            Hosted by <strong>{tournament.host.name}</strong>
          </p>
        </div>

        <EntryActions
          tournament={tournament}
          onJoin={() => setEntering('join')}
          onApply={() => setEntering('apply')}
        />
      </header>

      <dl className="tp__facts">
        <Fact label="Prize pool" value={formatCredits(tournament.totalPrize)} />
        <Fact label="Entry fee" value={formatCredits(tournament.entryFee)} />
        <Fact
          label="Entrants"
          value={formatCapacity({
            participantCount: tournament.participants.length,
            maxCapacity: tournament.maxCapacity,
            teamSize: tournament.teamSize,
          })}
        />
        <Fact label="Starts" value={formatDateTime(tournament.startDate)} />
        <Fact label="Ends" value={formatDateTime(tournament.endDate)} />
      </dl>

      <div className="tp__columns">
        <div className="tp__main">
          <Card>
            <h2 className="tp__section-title">
              {tournament.type === 'brackets' ? 'Bracket' : 'Standings'}
            </h2>
            {tournament.type === 'brackets' ? (
              <BracketView tournament={tournament} />
            ) : (
              <StandingsTable tournament={tournament} />
            )}
          </Card>

          <RichTextCard
            title="About"
            html={tournament.description}
            empty="The host has not written a description."
          />
          <RichTextCard title="Rules" html={tournament.rules} empty="No rules have been posted." />
        </div>

        <aside className="tp__side">
          <PrizeCard tournament={tournament} />
          <UpdatesCard updates={tournament.updates} />
          <ContactCard contact={tournament.contactInfo} />
        </aside>
      </div>

      {entering && (
        <EnterDialog
          tournament={tournament}
          mode={entering}
          open
          onClose={() => setEntering(null)}
        />
      )}
    </PageShell>
  )
}

function Fact({ label, value }) {
  return (
    <div className="tp__fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/**
 * What this visitor can do about this tournament.
 *
 * Every branch is decided by a flag the server computed, not by the client
 * inferring it: `isHost`, `isJoined`, `hasApplied` and `isAccepted` all arrive
 * on the payload.
 */
function EntryActions({ tournament, onJoin, onApply }) {
  const { isAuthenticated } = useAuth()
  const { viewer } = tournament

  if (viewer.isHost) {
    return (
      <div className="tp__actions">
        <Link className="btn btn--primary btn--md" to={`/tournament/${tournament.id}/manage`}>
          Manage tournament
        </Link>
      </div>
    )
  }

  if (viewer.isJoined) {
    return (
      <div className="tp__actions">
        <Badge tone="success">You are in this tournament</Badge>
      </div>
    )
  }

  if (tournament.hasEnded) return null

  if (tournament.hasStarted) {
    return (
      <div className="tp__actions">
        <p className="tp__note">This tournament is under way — entries are closed.</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="tp__actions">
        <Link className="btn btn--primary btn--md" to="/signin">
          Sign in to enter
        </Link>
      </div>
    )
  }

  const isFull = tournament.participants.length >= tournament.maxCapacity

  if (tournament.accessibility === 'application required') {
    if (viewer.isAccepted) {
      return (
        <div className="tp__actions">
          <Badge tone="success">Accepted</Badge>
          <Button variant="primary" onClick={onJoin}>
            Take your slot
          </Button>
        </div>
      )
    }
    if (viewer.hasApplied) {
      return (
        <div className="tp__actions">
          <Badge tone="accent">Application sent</Badge>
          <p className="tp__note">The host will let you know.</p>
        </div>
      )
    }
    return (
      <div className="tp__actions">
        <Button variant="primary" onClick={onApply} disabled={isFull}>
          {isFull ? 'Full' : 'Apply to enter'}
        </Button>
      </div>
    )
  }

  return (
    <div className="tp__actions">
      <Button variant="primary" onClick={onJoin} disabled={isFull}>
        {isFull ? 'Full' : `Join for ${formatCredits(tournament.entryCost)}`}
      </Button>
    </div>
  )
}

function RichTextCard({ title, html, empty }) {
  return (
    <Card>
      <h2 className="tp__section-title">{title}</h2>
      {isEmptyRichText(html) ? (
        <p className="tp__muted">{empty}</p>
      ) : (
        <div className="tp__prose" dangerouslySetInnerHTML={{ __html: toSafeHtml(html) }} />
      )}
    </Card>
  )
}

function PrizeCard({ tournament }) {
  return (
    <Card>
      <h2 className="tp__section-title">Prizes</h2>
      {tournament.type === 'brackets' ? (
        <p className="tp__prize-single">
          {formatCredits(tournament.prize)} <span>to the winner</span>
        </p>
      ) : (
        <ul className="tp__prize-list">
          {(tournament.prizes ?? []).map((entry) => (
            <li key={entry.rank}>
              <span>#{entry.rank}</span>
              <strong>{formatCredits(entry.prize)}</strong>
            </li>
          ))}
        </ul>
      )}
      <p className="tp__muted tp__bank">
        Prize bank: {formatCredits(tournament.bank)} of {formatCredits(tournament.totalPrize)}
      </p>
    </Card>
  )
}

function UpdatesCard({ updates }) {
  return (
    <Card>
      <h2 className="tp__section-title">Updates</h2>
      {updates.length === 0 ? (
        <p className="tp__muted">No updates from the host yet.</p>
      ) : (
        <ol className="tp__updates">
          {[...updates].reverse().map((update, index) => (
            <li key={`${update.date}-${index}`}>
              <time dateTime={update.date}>{formatDateTime(update.date)}</time>
              <p>{update.content}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

function ContactCard({ contact }) {
  const social = contact?.socialMedia ?? {}
  const entries = [
    ['Email', contact?.email],
    ['Phone', contact?.phone],
    ['Discord', social.discord],
    ['Instagram', social.instagram],
    ['Twitter', social.twitter],
    ['Facebook', social.facebook],
  ].filter(([, value]) => value)

  if (entries.length === 0) return null

  return (
    <Card>
      <h2 className="tp__section-title">Contact the host</h2>
      <dl className="tp__contact">
        {entries.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
