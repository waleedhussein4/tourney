import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { AuthProvider } from '/src/features/auth/AuthProvider.jsx'

/**
 * Renders a page the way the real app tree does — router, query client and
 * auth all in scope — without pulling in `Providers` itself, which hardcodes
 * a `BrowserRouter` tests cannot point at an initial route.
 *
 * Retries are off: a mocked 4xx/5xx should surface once, not after React
 * Query's default backoff delays a test by seconds.
 */
export function renderWithProviders(ui, { route = '/', queryClient } = {}) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

  return {
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    ),
    queryClient: client,
  }
}
