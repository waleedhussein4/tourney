import { acceptApplication, rejectApplication } from '/src/api/tournaments.js'
import { Accordion, Button, Card, CardHeader, EmptyState } from '/src/components/ui/index.js'
import { formatDateTime } from '/src/lib/format.js'
import { useManageMutation } from '../useManageMutation.js'

/** The queue of people asking to be let in. */
export function ApplicationsSection({ tournament }) {
  const accept = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: (applicationId) => acceptApplication(tournament.id, applicationId),
    success: 'Accepted — they can take their slot now',
  })

  const reject = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: (applicationId) => rejectApplication(tournament.id, applicationId),
    success: 'Application rejected',
  })

  const reserved = tournament.acceptedUsers.length + tournament.acceptedTeams.length
  const slotsLeft = tournament.maxCapacity - tournament.participants.length - reserved

  return (
    <Card>
      <CardHeader
        title="Applications"
        subtitle={
          slotsLeft > 0
            ? `${slotsLeft} ${slotsLeft === 1 ? 'slot' : 'slots'} left to give out.`
            : 'Every slot is taken or promised to someone you have accepted.'
        }
      />

      {tournament.applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          body="They appear here as people apply, with their answers to your questions."
        />
      ) : (
        tournament.applications.map((application) => (
          <Accordion
            key={application.id}
            title={`${application.name}${application.isTeam ? ' (team)' : ''}`}
          >
            <p className="manage__applied-at">Applied {formatDateTime(application.createdAt)}</p>

            <dl className="manage__answers">
              {application.fields.map((field) => (
                <div key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.input}</dd>
                </div>
              ))}
            </dl>

            <div className="manage__actions">
              <Button
                variant="primary"
                size="sm"
                onClick={() => accept.mutate(application.id)}
                loading={accept.isPending}
                disabled={slotsLeft <= 0}
              >
                Accept
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reject.mutate(application.id)}
                loading={reject.isPending}
              >
                Reject
              </Button>
            </div>
          </Accordion>
        ))
      )}
    </Card>
  )
}
