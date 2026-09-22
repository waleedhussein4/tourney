import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '/src/test/server.js'
import { renderWithProviders } from '/src/test/utils.jsx'
import { ResetPasswordPage } from './ResetPasswordPage.jsx'

describe('ResetPasswordPage', () => {
  it('reads the token from the query string and sends it with the new password', async () => {
    let sent
    server.use(
      http.post('/api/auth/reset-password', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ ok: true })
      })
    )
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password?token=abc123' })

    await user.type(screen.getByLabelText(/new password/i), 'NewPassword1')
    await user.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() => expect(sent).toEqual({ token: 'abc123', password: 'NewPassword1' }))
  })

  it('reports a weak password rejected by the server', async () => {
    server.use(
      http.post('/api/auth/reset-password', () =>
        HttpResponse.json({ error: { message: 'Password is too weak' } }, { status: 400 })
      )
    )
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password?token=abc123' })

    await user.type(screen.getByLabelText(/new password/i), 'weak')
    await user.click(screen.getByRole('button', { name: 'Reset password' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Password is too weak')
  })

  it('reports an invalid or expired token', async () => {
    server.use(
      http.post('/api/auth/reset-password', () =>
        HttpResponse.json(
          { error: { message: 'This link has expired. Request a new one.' } },
          { status: 400 }
        )
      )
    )
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password?token=expired' })

    await user.type(screen.getByLabelText(/new password/i), 'NewPassword1')
    await user.click(screen.getByRole('button', { name: 'Reset password' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/expired/i)
  })

  it('shows a way to request a new link when there is no token in the URL', () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password' })

    expect(screen.getByText(/missing its token/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /request a new link/i })).toBeInTheDocument()
  })
})
