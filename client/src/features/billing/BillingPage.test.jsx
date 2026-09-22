import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '/src/test/server.js'
import { renderWithProviders } from '/src/test/utils.jsx'
import { BillingPage } from './BillingPage.jsx'

const basePlan = { name: 'Pro', priceCents: 999, interval: 'month' }

function mockBilling(billing) {
  server.use(http.get('/api/billing/me', () => HttpResponse.json({ billing })))
}

describe('BillingPage', () => {
  it('renders the free-plan copy for status "none"', async () => {
    mockBilling({
      active: false,
      status: 'none',
      plan: basePlan,
      liveTournaments: 0,
      freeLiveTournaments: 1,
      gateway: { clientToken: 't', environment: 'sandbox' },
      contactEmail: 'support@tourney.app',
    })
    renderWithProviders(<BillingPage />)

    expect(await screen.findByText('Free plan')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('renders the active-plan copy for status "active"', async () => {
    mockBilling({
      active: true,
      status: 'active',
      plan: basePlan,
      renewsAt: '2026-10-01T00:00:00.000Z',
      liveTournaments: 2,
      freeLiveTournaments: 1,
      gateway: { clientToken: 't', environment: 'sandbox' },
      contactEmail: 'support@tourney.app',
    })
    renderWithProviders(<BillingPage />)

    expect(await screen.findByText('Pro plan')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText(/renews/i)).toBeInTheDocument()
  })

  it('renders the payment-issue copy for status "past_due"', async () => {
    mockBilling({
      active: true,
      status: 'past_due',
      plan: basePlan,
      liveTournaments: 1,
      freeLiveTournaments: 1,
      gateway: { clientToken: 't', environment: 'sandbox' },
      contactEmail: 'support@tourney.app',
    })
    renderWithProviders(<BillingPage />)

    expect(await screen.findByText('Payment issue')).toBeInTheDocument()
    expect(screen.getByText(/last payment failed/i)).toBeInTheDocument()
  })

  it('renders the canceled copy for status "canceled"', async () => {
    mockBilling({
      active: false,
      status: 'canceled',
      plan: basePlan,
      liveTournaments: 0,
      freeLiveTournaments: 1,
      gateway: { clientToken: 't', environment: 'sandbox' },
      contactEmail: 'support@tourney.app',
    })
    renderWithProviders(<BillingPage />)

    expect(await screen.findByText('Plan canceled')).toBeInTheDocument()
    expect(screen.getByText('Canceled')).toBeInTheDocument()
  })

  it('renders the unavailable state when there is no payment gateway', async () => {
    mockBilling({
      active: false,
      status: 'none',
      plan: basePlan,
      liveTournaments: 0,
      freeLiveTournaments: 1,
      gateway: null,
      contactEmail: 'support@tourney.app',
    })
    renderWithProviders(<BillingPage />)

    await screen.findByText('Free plan')
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument()
    expect(screen.getByText(/not available on this deployment/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'support@tourney.app' })).toHaveAttribute(
      'href',
      'mailto:support@tourney.app'
    )
  })
})
