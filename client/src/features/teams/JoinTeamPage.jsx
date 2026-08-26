import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { joinTeamByCode, previewTeamByCode } from '/src/api/teams.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, Card, EmptyState, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { teamKeys } from './queries.js'
import styles from './teams.module.css'

/** What an invite link lands on: the team's name, and a button. */
export function JoinTeamPage() {
  const { teamCode } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const preview = useQuery({
    queryKey: teamKeys.byCode(teamCode),
    queryFn: () => previewTeamByCode(teamCode),
    retry: false,
  })

  const join = useMutation({
    mutationFn: () => joinTeamByCode(teamCode),
    onSuccess: ({ team }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
      toast.success(`You are on ${team.name}`)
      navigate(`/team/view?UUID=${team.id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  if (preview.isPending) {
    return (
      <PageShell width="narrow">
        <LoadingState label="Looking up that team" rows={1} />
      </PageShell>
    )
  }

  if (preview.isError) {
    return (
      <PageShell width="narrow">
        {preview.error.status === 404 ? (
          <EmptyState
            title="No team has that code"
            body="Invite codes are six characters. Check you copied the whole thing."
            action={
              <Button variant="primary" onClick={() => navigate('/teams')}>
                Back to teams
              </Button>
            }
          />
        ) : (
          <ErrorState error={preview.error} onRetry={() => preview.refetch()} />
        )}
      </PageShell>
    )
  }

  const team = preview.data.team

  // Already on it — there is nothing to accept, so go straight through.
  if (team.isMember) {
    navigate(`/team/view?UUID=${team.id}`, { replace: true })
    return null
  }

  return (
    <PageShell width="narrow">
      <Card className={styles.inviteLanding}>
        <p className={styles.invited}>You have been invited to join</p>
        <h1>{team.name}</h1>
        <p className={styles.teamMeta}>
          {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
        </p>

        <div className={styles.inviteActions}>
          <Button variant="primary" onClick={() => join.mutate()} loading={join.isPending}>
            Join this team
          </Button>
          <Button variant="ghost" onClick={() => navigate('/teams')}>
            Not now
          </Button>
        </div>
      </Card>
    </PageShell>
  )
}
