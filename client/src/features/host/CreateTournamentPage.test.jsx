import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '/src/test/server.js'
import { renderWithProviders } from '/src/test/utils.jsx'
import { CreateTournamentPage } from './CreateTournamentPage.jsx'

function mockCategories() {
  server.use(
    http.get('/api/tournaments/categories', () =>
      HttpResponse.json({ categories: [{ slug: 'fps', name: 'FPS' }] })
    )
  )
}

describe('CreateTournamentPage wizard', () => {
  it('starts on the format step with team size defaulted to a valid value', () => {
    mockCategories()
    renderWithProviders(<CreateTournamentPage />)

    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create a tournament' })).toBeInTheDocument()
  })

  it('does not advance past the format step when team size is invalid', async () => {
    mockCategories()
    const user = userEvent.setup()
    renderWithProviders(<CreateTournamentPage />)

    const teamSize = screen.getByLabelText(/team size/i)
    await user.clear(teamSize)
    await user.type(teamSize, '0')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText('At least 1')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
  })

  it('advances to the details step once the format step is valid', async () => {
    mockCategories()
    const user = userEvent.setup()
    renderWithProviders(<CreateTournamentPage />)

    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText('Step 2 of 5')).toBeInTheDocument()
  })
})
