import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createTeam, listMyTeams } from '/src/api/teams.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
} from '/src/components/ui/index.js'
import { teamKeys } from './queries.js'
import './teams.css'

/** The teams you are on, and the two ways to get onto another. */
export function TeamsPage() {
  const [dialog, setDialog] = useState(null)

  const teams = useQuery({ queryKey: teamKeys.mine, queryFn: listMyTeams })

  return (
    <PageShell>
      <PageHeader
        title="Teams"
        description="Team tournaments are entered by a team, and the leader pays the entry fee."
        actions={
          <>
            <Button onClick={() => setDialog('join')}>Join with a code</Button>
            <Button variant="primary" onClick={() => setDialog('create')}>
              Create a team
            </Button>
          </>
        }
      />

      {teams.isPending ? (
        <LoadingState label="Loading your teams" rows={2} />
      ) : teams.isError ? (
        <ErrorState error={teams.error} onRetry={() => teams.refetch()} />
      ) : teams.data.teams.length === 0 ? (
        <EmptyState
          title="You are not on a team yet"
          body="Create one and share its code, or join a team someone has invited you to."
          action={
            <>
              <Button variant="primary" onClick={() => setDialog('create')}>
                Create a team
              </Button>
              <Button variant="ghost" onClick={() => setDialog('join')}>
                Join with a code
              </Button>
            </>
          }
        />
      ) : (
        <ul className="teams__grid">
          {teams.data.teams.map((team) => (
            <li key={team.id}>
              <Card className="teams__card">
                <h2 className="teams__name">
                  <Link to={`/team/view?UUID=${team.id}`}>{team.name}</Link>
                </h2>
                <p className="teams__members">
                  {team.members.map((member) => member.username).join(', ')}
                </p>
                <p className="teams__meta">
                  {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                  {team.isLeader && ' · you lead this team'}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <CreateTeamDialog open={dialog === 'create'} onClose={() => setDialog(null)} />
      <JoinTeamDialog open={dialog === 'join'} onClose={() => setDialog(null)} />
    </PageShell>
  )
}

function CreateTeamDialog({ open, onClose }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '' } })

  async function onSubmit({ name }) {
    try {
      const { team } = await createTeam(name)
      queryClient.invalidateQueries({ queryKey: teamKeys.mine })
      toast.success('Team created')
      reset()
      onClose()
      navigate(`/team/view?UUID=${team.id}`)
    } catch (error) {
      setError('name', { message: error.message })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a team"
      description="You lead it, and you get a code to invite the others."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-team" variant="primary" loading={isSubmitting}>
            Create
          </Button>
        </>
      }
    >
      <form id="create-team" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Team name" required error={errors.name?.message}>
          {(field) => (
            <Input
              {...field}
              {...register('name', {
                required: 'Give the team a name',
                minLength: { value: 3, message: 'At least 3 characters' },
                maxLength: { value: 32, message: 'At most 32 characters' },
              })}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}

function JoinTeamDialog({ open, onClose }) {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { code: '' } })

  // The code is also the last segment of an invite link, so pasting either works.
  const onSubmit = ({ code }) => {
    const match = code
      .trim()
      .toUpperCase()
      .match(/[A-Z0-9]{6}$/)
    onClose()
    navigate(`/team/join/${match ? match[0] : code.trim()}`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Join a team"
      description="Paste the six-character code, or the whole invite link."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="join-team" variant="primary" loading={isSubmitting}>
            Continue
          </Button>
        </>
      }
    >
      <form id="join-team" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Code or link" required error={errors.code?.message}>
          {(field) => (
            <Input
              {...field}
              placeholder="ABC234"
              {...register('code', {
                required: 'Paste the code or the link',
                pattern: {
                  value: /[A-Za-z0-9]{6}\s*$/,
                  message: 'That does not end in a six-character code',
                },
              })}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
