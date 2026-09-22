import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '/src/test/server.js'
import { renderWithProviders } from '/src/test/utils.jsx'
import { ForgotPasswordPage } from './ForgotPasswordPage.jsx'

describe('ForgotPasswordPage', () => {
  it('submits the typed email and shows the confirmation', async () => {
    const forgot = vi.fn()
    server.use(
      http.post('/api/auth/forgot-password', async ({ request }) => {
        forgot(await request.json())
        return HttpResponse.json({ ok: true })
      })
    )
    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText(/email/i), 'someone@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(await screen.findByRole('status')).toHaveTextContent(/reset link is on its way/i)
    expect(forgot).toHaveBeenCalledWith(expect.objectContaining({ email: 'someone@example.com' }))
  })

  // Deliberate anti-enumeration property: the confirmation copy must not
  // depend on whether the account exists, so a well-meaning "helpful" change
  // that branches on the response would fail this.
  it('shows the identical confirmation whether or not the account exists', async () => {
    server.use(http.post('/api/auth/forgot-password', () => HttpResponse.json({ ok: true })))
    const user = userEvent.setup()
    const { unmount } = renderWithProviders(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText(/email/i), 'exists@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    const existingCopy = (await screen.findByRole('status')).textContent
    unmount()

    renderWithProviders(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText(/email/i), 'nobody@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    const missingCopy = (await screen.findByRole('status')).textContent

    expect(missingCopy).toBe(existingCopy)
  })
})
