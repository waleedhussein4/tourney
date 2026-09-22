import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { applyToTournament, joinAsTeam, joinSolo, tournamentKeys } from '/src/api/tournaments.js'
import { listMyTeams } from '/src/api/teams.js'
import { currentUserKey } from '/src/features/auth/queries.js'
import { Button, Field, Input, Modal, Spinner } from '/src/components/ui/index.js'
import styles from './EnterDialog.module.css'

/**
 * Entering a tournament: joining directly, or applying to be let in.
 *
 * One dialog for both because the decisions are the same — solo or with a
 * team — and only the final request differs.
 */
export function EnterDialog({ tournament, mode, open, onClose }) {
  const isApplication = mode === 'apply'
  const isTeamBased = tournament.teamSize > 1

  const queryClient = useQueryClient()
  const [teamId, setTeamId] = useState('')

  const teams = useQuery({
    queryKey: ['teams', 'mine'],
    queryFn: listMyTeams,
    enabled: open && isTeamBased,
  })

  const { register, handleSubmit, formState } = useForm()

  const enter = useMutation({
    mutationFn: (values) => {
      if (isApplication) {
        return applyToTournament(tournament.id, {
          teamId: isTeamBased ? teamId : undefined,
          fields: tournament.applicationForm.map((label) => ({
            label,
            input: values[label] ?? '',
          })),
        })
      }
      return isTeamBased ? joinAsTeam(tournament.id, teamId) : joinSolo(tournament.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournament.id) })
      queryClient.invalidateQueries({ queryKey: currentUserKey })
      toast.success(isApplication ? 'Application sent' : 'You are in')
      onClose()
    },
    onError: (error) => toast.error(error.message),
  })

  const eligibleTeams = (teams.data?.teams ?? []).filter(
    (team) => team.isLeader && team.members.length === tournament.teamSize
  )
  const chosenTeamMissing = isTeamBased && !teamId

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isApplication ? `Apply to ${tournament.title}` : `Join ${tournament.title}`}
      description={
        isApplication ? 'The host reviews applications and decides who gets a slot.' : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={enter.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            form="enter-form"
            type="submit"
            loading={enter.isPending}
            disabled={chosenTeamMissing}
          >
            {isApplication ? 'Send application' : 'Join'}
          </Button>
        </>
      }
    >
      <form
        id="enter-form"
        className={styles.enter}
        onSubmit={handleSubmit((values) => enter.mutate(values))}
      >
        {isTeamBased && (
          <TeamPicker
            teams={teams}
            eligible={eligibleTeams}
            value={teamId}
            onChange={setTeamId}
            tournament={tournament}
          />
        )}

        {isApplication &&
          tournament.applicationForm.map((label) => (
            <Field key={label} label={label} required error={formState.errors[label]?.message}>
              {(field) => (
                <Input {...field} {...register(label, { required: 'This one is required' })} />
              )}
            </Field>
          ))}
      </form>
    </Modal>
  )
}

function TeamPicker({ teams, eligible, value, onChange, tournament }) {
  if (teams.isPending) return <Spinner label="Loading your teams" />

  if (eligible.length === 0) {
    return (
      <p className={styles.warning}>
        You need to lead a team of exactly {tournament.teamSize} to enter this one.{' '}
        <Link to="/teams">Manage your teams</Link>
      </p>
    )
  }

  return (
    <fieldset className={styles.teams}>
      <legend>Enter with</legend>
      {eligible.map((team) => (
        <label key={team.id} className={styles.team}>
          <input
            type="radio"
            name="team"
            value={team.id}
            checked={value === team.id}
            onChange={(event) => onChange(event.target.value)}
          />
          <span>
            <span className={styles.teamName}>{team.name}</span>
            <span className={styles.teamRoster}>
              {team.members.map((member) => member.username).join(', ')}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
