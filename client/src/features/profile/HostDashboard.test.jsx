import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '/src/test/server.js'
import { renderWithProviders } from '/src/test/utils.jsx'
import { HostDashboard } from './HostDashboard.jsx'

function mockHostDashboard(tournaments) {
  server.use(http.get('/api/users/me/host-dashboard', () => HttpResponse.json({ tournaments })))
}

describe('HostDashboard', () => {
  it('shows a loading state before the dashboard arrives', () => {
    server.use(http.get('/api/users/me/host-dashboard', () => new Promise(() => {})))
    renderWithProviders(<HostDashboard />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows an error state with a retry that re-fetches', async () => {
    let calls = 0
    server.use(
      http.get('/api/users/me/host-dashboard', () => {
        calls += 1
        return HttpResponse.json(
          { error: { message: 'Could not load your tournaments' } },
          { status: 500 }
        )
      })
    )
    renderWithProviders(<HostDashboard />)

    expect(await screen.findByText('Could not load your tournaments')).toBeInTheDocument()
    const callsBeforeRetry = calls
    screen.getByRole('button', { name: 'Try again' }).click()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(calls).toBeGreaterThan(callsBeforeRetry)
  })

  it('reads as reassurance when every tournament is running itself', async () => {
    mockHostDashboard([
      {
        tournamentId: 't1',
        tournamentTitle: 'Quiet Cup',
        pendingApplications: 0,
        disputedMatches: [],
        unscheduledMatches: [],
        awaitingConfirmation: [],
        roundsReady: [],
        total: 0,
      },
    ])
    renderWithProviders(<HostDashboard />)

    expect(await screen.findByText(/running itself/)).toBeInTheDocument()
  })

  it('surfaces only tournaments that need something, with a count', async () => {
    mockHostDashboard([
      {
        tournamentId: 't1',
        tournamentTitle: 'Quiet Cup',
        pendingApplications: 0,
        disputedMatches: [],
        unscheduledMatches: [],
        awaitingConfirmation: [],
        roundsReady: [],
        total: 0,
      },
      {
        tournamentId: 't2',
        tournamentTitle: 'Busy Cup',
        pendingApplications: 2,
        disputedMatches: ['m1'],
        unscheduledMatches: [],
        awaitingConfirmation: [],
        roundsReady: [],
        total: 3,
      },
    ])
    renderWithProviders(<HostDashboard />)

    expect(await screen.findByText('Busy Cup')).toBeInTheDocument()
    expect(screen.getByText(/3 things need you/)).toBeInTheDocument()
    expect(screen.queryByText('Quiet Cup')).not.toBeInTheDocument()
  })
})
