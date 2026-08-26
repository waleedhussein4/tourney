import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { deleteTeam, getTeam, kickMember, leaveTeam, transferLeadership } from '/src/api/teams.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  ErrorState,
  LoadingState,
} from '/src/components/ui/index.js'
import { teamKeys } from './queries.js'
import styles from './teams.module.css'

/**
 * One team: its roster, its invite link, and what the leader can do about both.
 *
 * The original version of this page could not work: `deleteTeam` and
 * `leaveTeam` were module-level functions calling a `navigate` that only existed
 * inside the component, and kicking a member removed the row by reaching into
 * the DOM. Here the actions are inside the component and the roster comes from
 * the query, so both are structurally impossible.
 */
export function TeamPage() {
  const [searchParams] = useSearchParams()
  const teamId = searchParams.get('UUID')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [pending, setPending] = useState(null)
  const [copied, setCopied] = useState(false)

  const query = useQuery({
    queryKey: teamKeys.detail(teamId),
    queryFn: () => getTeam(teamId),
    enabled: Boolean(teamId),
  })

  const act = useMutation({
    mutationFn: ({ run }) => run(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
      toast.success(variables.success)
      setPending(null)
      if (variables.leave) navigate('/teams')
    },
    onError: (error) => {
      toast.error(error.message)
      setPending(null)
    },
  })

  if (query.isPending) {
    return (
      <PageShell width="narrow">
        <LoadingState label="Loading team" rows={2} />
      </PageShell>
    )
  }

  if (query.isError) {
    return (
      <PageShell width="narrow">
        <ErrorState
          title="Could not load this team"
          error={query.error}
          onRetry={() => query.refetch()}
          action={
            <Button variant="ghost" onClick={() => navigate('/teams')}>
              Back to teams
            </Button>
          }
        />
      </PageShell>
    )
  }

  const team = query.data.team
  const inviteLink = `${window.location.origin}/team/join/${team.joinCode}`

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Invite link copied')
  }

  return (
    <PageShell width="narrow">
      <PageHeader
        title={team.name}
        description={`${team.members.length} ${team.members.length === 1 ? 'member' : 'members'}`}
        actions={team.isLeader && <Badge tone="accent">You lead this team</Badge>}
        eyebrow="Team"
      />

      <div className={styles.stack}>
        <Card>
          <CardHeader title="Members" />
          <ul className={styles.roster}>
            {team.members.map((member) => (
              <li key={member.id} className={styles.member}>
                <span className={styles.memberName}>
                  {member.username}
                  {member.isLeader && <Badge tone="accent">Leader</Badge>}
                </span>

                {team.isLeader && !member.isLeader && (
                  <span className={styles.memberActions}>
                    <Button
                      size="sm"
                      onClick={() =>
                        setPending({
                          title: `Make ${member.username} the leader?`,
                          description:
                            'They take over paying entry fees and managing the roster. You stay on the team.',
                          confirmLabel: 'Transfer leadership',
                          success: 'Leadership transferred',
                          run: () => transferLeadership(team.id, member.username),
                        })
                      }
                    >
                      Make leader
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setPending({
                          title: `Remove ${member.username}?`,
                          description: 'They can rejoin later with the team code.',
                          confirmLabel: 'Remove',
                          destructive: true,
                          success: `${member.username} removed`,
                          run: () => kickMember(team.id, member.username),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Invite" subtitle="Anyone with this link or code can join the team." />
          <div className={styles.invite}>
            <code className={styles.code}>{team.joinCode}</code>
            <Button onClick={copyInvite}>{copied ? 'Copied' : 'Copy link'}</Button>
          </div>
          <p className={styles.inviteLink}>{inviteLink}</p>
        </Card>

        <Card>
          <CardHeader
            title={team.isLeader ? 'Delete this team' : 'Leave this team'}
            subtitle={
              team.isLeader
                ? 'The team is removed for everyone. Not possible while it is competing.'
                : 'You can rejoin later with the code. Not possible while the team is competing.'
            }
          />
          {team.isLeader ? (
            <Button
              variant="danger"
              onClick={() =>
                setPending({
                  title: `Delete ${team.name}?`,
                  description: 'The team is removed for everyone on it. This cannot be undone.',
                  confirmLabel: 'Delete team',
                  destructive: true,
                  success: 'Team deleted',
                  leave: true,
                  run: () => deleteTeam(team.id),
                })
              }
            >
              Delete team
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={() =>
                setPending({
                  title: `Leave ${team.name}?`,
                  description: 'You can rejoin later with the team code.',
                  confirmLabel: 'Leave',
                  destructive: true,
                  success: 'You left the team',
                  leave: true,
                  run: () => leaveTeam(team.id),
                })
              }
            >
              Leave team
            </Button>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={() => act.mutate(pending)}
        loading={act.isPending}
        title={pending?.title ?? ''}
        description={pending?.description}
        confirmLabel={pending?.confirmLabel}
        destructive={pending?.destructive}
      />
    </PageShell>
  )
}
