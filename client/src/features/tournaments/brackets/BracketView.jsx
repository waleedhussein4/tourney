import { useState } from 'react'
import { Bracket, Seed, SeedItem, SeedTeam } from 'react-brackets'
import { Badge, Modal } from '/src/components/ui/index.js'
import { buildRounds, championOf } from './buildRounds.js'
import './BracketView.css'

/**
 * The single-elimination bracket, for both solo and team tournaments.
 *
 * One component for both: a competitor is a participant, and whether that
 * participant is one person or a squad only changes what clicking it shows. The
 * original had two near-identical files, and the solo one crashed on any click
 * because its handler called a `navigate` that was not in scope.
 */
export function BracketView({ tournament }) {
  const [inspecting, setInspecting] = useState(null)

  const rounds = buildRounds(tournament)
  const champion = championOf(tournament)
  const isTeamBased = tournament.teamSize > 1

  const renderSeed = ({ seed, breakpoint }) => (
    <Seed mobileBreakpoint={breakpoint} className="seed">
      <SeedItem>
        <div>
          {seed.teams.map((team, index) => (
            <SeedTeam
              key={`${seed.id}-${index}`}
              className={[
                'seed__team',
                team.isWinner && 'seed__team--winner',
                team.eliminated && 'seed__team--out',
                !team.name && 'seed__team--tba',
              ]
                .filter(Boolean)
                .join(' ')}
              // Only a real competitor is interactive; a "TBA" slot is not.
              onClick={team.name ? () => setInspecting(team.id) : undefined}
              role={team.name ? 'button' : undefined}
              tabIndex={team.name ? 0 : undefined}
              onKeyDown={
                team.name
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setInspecting(team.id)
                      }
                    }
                  : undefined
              }
            >
              <span className="seed__name">{team.name ?? 'TBA'}</span>
              {team.score !== null && team.score !== 0 && (
                <span className="seed__score">{team.score}</span>
              )}
            </SeedTeam>
          ))}
        </div>
      </SeedItem>
    </Seed>
  )

  const inspected = (tournament.participants ?? []).find((entry) => entry.id === inspecting)

  return (
    <div className="bracket">
      {champion && (
        <p className="bracket__champion">
          <Badge tone="success">Winner</Badge> {champion.name}
        </p>
      )}

      <div className="bracket__scroll">
        <Bracket rounds={rounds} renderSeedComponent={renderSeed} mobileBreakpoint={0} />
      </div>

      <Modal
        open={Boolean(inspected)}
        onClose={() => setInspecting(null)}
        title={inspected?.name ?? ''}
        description={isTeamBased ? 'Team roster' : undefined}
      >
        {inspected && (
          <dl className="bracket__details">
            <div>
              <dt>Score</dt>
              <dd>{inspected.score ?? 0}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{inspected.eliminated ? 'Eliminated' : 'Still in'}</dd>
            </div>
            {isTeamBased && (
              <div className="bracket__roster">
                <dt>Players</dt>
                <dd>
                  <ul>
                    {(inspected.members ?? []).map((member) => (
                      <li key={member.id}>{member.name}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        )}
      </Modal>
    </div>
  )
}
