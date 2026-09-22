import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '/src/test/server.js'
import { renderWithProviders } from '/src/test/utils.jsx'
import { NotificationBell } from './NotificationBell.jsx'

function mockSignedIn() {
  server.use(
    http.get('/api/users/me', () =>
      HttpResponse.json({ user: { id: 'u1', username: 'mei', emailVerified: true } })
    )
  )
}

describe('NotificationBell', () => {
  it('shows the unread count on the bell', async () => {
    mockSignedIn()
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          notifications: [
            {
              _id: 'n1',
              type: 'match_scheduled',
              title: 'Match scheduled',
              body: 'Your match is set.',
              read: false,
              createdAt: new Date().toISOString(),
            },
          ],
          unreadCount: 1,
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        })
      )
    )
    renderWithProviders(<NotificationBell />)

    expect(await screen.findByText('1')).toBeInTheDocument()
  })

  it('reads as a good thing when there is nothing to show', async () => {
    mockSignedIn()
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          notifications: [],
          unreadCount: 0,
          pagination: { page: 1, limit: 20, total: 0, pages: 1 },
        })
      )
    )
    renderWithProviders(<NotificationBell />)

    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))

    expect(await screen.findByText("You're all caught up")).toBeInTheDocument()
  })

  it('marks a notification read when opened', async () => {
    mockSignedIn()
    let markedRead = false
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          notifications: [
            {
              _id: 'n1',
              type: 'tournament_ended',
              title: 'Tournament ended',
              body: 'It is over.',
              read: false,
              createdAt: new Date().toISOString(),
            },
          ],
          unreadCount: 1,
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        })
      ),
      http.post('/api/notifications/n1/read', () => {
        markedRead = true
        return HttpResponse.json({ notification: { _id: 'n1', read: true } })
      })
    )
    renderWithProviders(<NotificationBell />)

    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }))
    await userEvent.click(await screen.findByText('Tournament ended'))

    await waitFor(() => expect(markedRead).toBe(true))
  })
})
