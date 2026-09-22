import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '/src/test/server.js'
import { renderWithProviders } from '/src/test/utils.jsx'
import { SignInPage } from './SignInPage.jsx'

describe('SignInPage', () => {
  it('renders the sign-in form', () => {
    renderWithProviders(<SignInPage />)
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('shows validation errors on an empty submit and never calls the API', async () => {
    const login = vi.fn()
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        login(await request.json())
        return HttpResponse.json({ user: {} })
      })
    )
    const user = userEvent.setup()
    renderWithProviders(<SignInPage />)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter your email address')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('calls the API with what was typed', async () => {
    const login = vi.fn()
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        login(await request.json())
        return HttpResponse.json({ user: { id: '1', username: 'demo' } })
      })
    )
    const user = userEvent.setup()
    renderWithProviders(<SignInPage />)

    await user.type(screen.getByLabelText(/email/i), 'player@example.com')
    await user.type(screen.getByLabelText(/password/i), 'hunter22')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'player@example.com', password: 'hunter22' })
      )
    )
  })

  it('shows a server error without navigating away', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ error: { message: 'Incorrect email or password' } }, { status: 401 })
      )
    )
    const user = userEvent.setup()
    renderWithProviders(<SignInPage />)

    await user.type(screen.getByLabelText(/email/i), 'player@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password')
  })

  it('fills the form when "Use the demo account" is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignInPage />)

    await user.click(screen.getByRole('button', { name: 'Use the demo account' }))

    expect(screen.getByLabelText(/email/i)).toHaveValue('demo@tourney.app')
    expect(screen.getByLabelText(/password/i)).toHaveValue('DemoPlayer2026')
  })
})
