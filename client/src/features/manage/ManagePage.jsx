import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getManageView, tournamentKeys } from '/src/api/tournaments.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Badge, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { publishStatus, tournamentStatus } from '/src/lib/format.js'
import { useDocumentTitle } from '/src/lib/useDocumentTitle.js'
import { DetailsSection } from './sections/DetailsSection.jsx'
import { ApplicationsSection } from './sections/ApplicationsSection.jsx'
import { ParticipantsSection } from './sections/ParticipantsSection.jsx'
import { MatchesSection } from './sections/MatchesSection.jsx'
import { UpdatesSection } from './sections/UpdatesSection.jsx'
import { LifecycleSection } from './sections/LifecycleSection.jsx'
import { PublishSection } from './sections/PublishSection.jsx'
import styles from './ManagePage.module.css'

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

  useDocumentTitle(query.data ? `Manage ${query.data.tournament.name}` : 'Manage tournament')

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
  const publish = publishStatus(tournament.publishState)

  return (
    <PageShell>
      <PageHeader
        eyebrow="Managing"
        title={tournament.title}
        description="Everything you can change about this tournament, and everything it needs before it can start."
        actions={
          <>
            {publish && <Badge tone={publish.tone}>{publish.label}</Badge>}
            <Badge tone={status.tone}>{status.label}</Badge>
          </>
        }
      />

      <div className={styles.page}>
        <PublishSection tournament={tournament} />
        <LifecycleSection tournament={tournament} />
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
