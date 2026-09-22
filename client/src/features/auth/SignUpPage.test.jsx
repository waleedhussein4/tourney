import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '/src/test/server.js'
import { renderWithProviders } from '/src/test/utils.jsx'
import { SignUpPage } from './SignUpPage.jsx'

async function fillValidForm(user) {
  await user.type(screen.getByLabelText(/username/i), 'newplayer')
  await user.type(screen.getByLabelText(/^email/i), 'new@example.com')
  await user.type(screen.getByLabelText(/^password/i), 'Password1')
  await user.type(screen.getByLabelText(/confirm password/i), 'Password1')
}

describe('SignUpPage', () => {
  it('rejects a password missing the required character classes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignUpPage />)

    await user.type(screen.getByLabelText(/^password/i), 'alllowercase')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Include an uppercase letter')).toBeInTheDocument()
  })

  it('rejects a password shorter than 8 characters', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignUpPage />)

    await user.type(screen.getByLabelText(/^password/i), 'Ab1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('At least 8 characters')).toBeInTheDocument()
  })

  it('rejects a confirmation that does not match', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignUpPage />)

    await user.type(screen.getByLabelText(/^password/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password2')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('The passwords do not match')).toBeInTheDocument()
  })

  it('pins the conflict error to the email field when the email is taken', async () => {
    server.use(
      http.post('/api/auth/signup', () =>
        HttpResponse.json(
          { error: { message: 'That email is already registered' } },
          { status: 409 }
        )
      )
    )
    const user = userEvent.setup()
    renderWithProviders(<SignUpPage />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    const emailField = screen.getByLabelText(/^email/i)
    expect(await screen.findByText('That email is already registered')).toBeInTheDocument()
    expect(emailField).toHaveAccessibleDescription(/already registered/i)
  })
})
