import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getManageView, tournamentKeys } from '/src/api/tournaments.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Badge, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { tournamentStatus } from '/src/lib/format.js'
import { DetailsSection } from './sections/DetailsSection.jsx'
import { BankSection } from './sections/BankSection.jsx'
import { ApplicationsSection } from './sections/ApplicationsSection.jsx'
import { ParticipantsSection } from './sections/ParticipantsSection.jsx'
import { MatchesSection } from './sections/MatchesSection.jsx'
import { UpdatesSection } from './sections/UpdatesSection.jsx'
import { LifecycleSection } from './sections/LifecycleSection.jsx'
import './ManagePage.css'

/**
 * The host's control panel.
 *
 * One query for the whole tournament, and a section component per thing a host
 * can do to it. Each section owns its own mutation and invalidates this query on
 * success, so the page reflects the change without the full-page reload the
 * original did after every action.
 */
export function ManagePage() {
  const { UUID: id } = useParams()

  const query = useQuery({
    queryKey: tournamentKeys.manage(id),
    queryFn: () => getManageView(id),
    enabled: Boolean(id),
  })

  if (query.isPending) {
    return (
      <PageShell>
        <LoadingState label="Loading your tournament" rows={4} />
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
        />
      </PageShell>
    )
  }

  const tournament = query.data.tournament
  const status = tournamentStatus({
    ...tournament,
    participantCount: tournament.participants.length,
  })

  return (
    <PageShell>
      <PageHeader
        title={tournament.title}
        description="Everything you can change about this tournament, and everything it needs before it can start."
        actions={<Badge tone={status.tone}>{status.label}</Badge>}
      />

      <div className="manage">
        <LifecycleSection tournament={tournament} />
        <BankSection tournament={tournament} />
        {tournament.accessibility === 'application required' && (
          <ApplicationsSection tournament={tournament} />
        )}
        <ParticipantsSection tournament={tournament} />
        {tournament.type === 'brackets' && <MatchesSection tournament={tournament} />}
        <UpdatesSection tournament={tournament} />
        <DetailsSection tournament={tournament} />
      </div>
    </PageShell>
  )
}
