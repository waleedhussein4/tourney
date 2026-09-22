import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '/src/test/server.js'
import { renderWithProviders } from '/src/test/utils.jsx'
import { BrowsePage } from './BrowsePage.jsx'

function mockCategories() {
  server.use(
    http.get('/api/tournaments/categories', () =>
      HttpResponse.json({ categories: [{ slug: 'fps', name: 'FPS' }] })
    )
  )
}

describe('BrowsePage', () => {
  it('shows a loading state before the list arrives', () => {
    mockCategories()
    server.use(http.get('/api/tournaments', () => new Promise(() => {})))
    renderWithProviders(<BrowsePage />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows an error state with a retry that re-fetches', async () => {
    mockCategories()
    let calls = 0
    server.use(
      http.get('/api/tournaments', () => {
        calls += 1
        return HttpResponse.json(
          { error: { message: 'Could not load tournaments' } },
          { status: 500 }
        )
      })
    )
    renderWithProviders(<BrowsePage />)

    expect(await screen.findByText('Could not load tournaments')).toBeInTheDocument()
    const callsBeforeRetry = calls
    screen.getByRole('button', { name: 'Try again' }).click()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(calls).toBeGreaterThan(callsBeforeRetry)
  })

  it('shows the empty state when there are no tournaments and no filters', async () => {
    mockCategories()
    server.use(
      http.get('/api/tournaments', () =>
        HttpResponse.json({ tournaments: [], pagination: { total: 0, page: 1, pages: 1 } })
      )
    )
    renderWithProviders(<BrowsePage />)

    expect(await screen.findByText('No tournaments yet')).toBeInTheDocument()
  })
})
