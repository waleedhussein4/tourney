import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '/src/test/server.js'
import { renderWithProviders } from '/src/test/utils.jsx'
import { PlayerDashboard } from './PlayerDashboard.jsx'

function mockDashboard(data) {
  server.use(http.get('/api/users/me/dashboard', () => HttpResponse.json(data)))
}

const EMPTY = { nextMatch: null, awaitingConfirmation: [], applications: [] }

describe('PlayerDashboard', () => {
  it('shows a loading state before the dashboard arrives', () => {
    server.use(http.get('/api/users/me/dashboard', () => new Promise(() => {})))
    renderWithProviders(<PlayerDashboard />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows an error state with a retry that re-fetches', async () => {
    let calls = 0
    server.use(
      http.get('/api/users/me/dashboard', () => {
        calls += 1
        return HttpResponse.json(
          { error: { message: 'Could not load your dashboard' } },
          { status: 500 }
        )
      })
    )
    renderWithProviders(<PlayerDashboard />)

    expect(await screen.findByText('Could not load your dashboard')).toBeInTheDocument()
    const callsBeforeRetry = calls
    screen.getByRole('button', { name: 'Try again' }).click()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(calls).toBeGreaterThan(callsBeforeRetry)
  })

  it('reads calmly, not as broken, when nothing is scheduled', async () => {
    mockDashboard(EMPTY)
    renderWithProviders(<PlayerDashboard />)

    expect(await screen.findByText(/Nothing scheduled right now/)).toBeInTheDocument()
  })

  it('shows the next match with the opponent and tournament', async () => {
    mockDashboard({
      ...EMPTY,
      nextMatch: {
        tournamentId: 't1',
        tournamentTitle: 'Spring Cup',
        round: 2,
        scheduledAt: '2026-10-12T20:00:00.000Z',
        opponentName: 'kofi',
      },
    })
    renderWithProviders(<PlayerDashboard />)

    expect(await screen.findByText(/Round 2 vs/)).toBeInTheDocument()
    expect(screen.getByText('kofi')).toBeInTheDocument()
    expect(screen.getByText(/Spring Cup/)).toBeInTheDocument()
  })

  it('shows a result awaiting confirmation and an in-flight application', async () => {
    mockDashboard({
      nextMatch: null,
      awaitingConfirmation: [
        {
          tournamentId: 't2',
          tournamentTitle: 'Winter Cup',
          matchId: 'm1',
          round: 1,
          opponentName: 'ada',
        },
      ],
      applications: [{ tournamentId: 't3', tournamentTitle: 'Gated Cup', status: 'pending' }],
    })
    renderWithProviders(<PlayerDashboard />)

    expect(await screen.findByText('Confirm result')).toBeInTheDocument()
    expect(screen.getByText(/Winter Cup/)).toBeInTheDocument()
    expect(screen.getByText('Gated Cup')).toBeInTheDocument()
    expect(screen.getByText('Awaiting decision')).toBeInTheDocument()
  })
})
