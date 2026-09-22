import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server.js'

// Without `test.globals: true`, @testing-library/react can't detect a global
// `afterEach` to auto-register its cleanup, so the DOM from one test would
// otherwise still be mounted when the next test's queries run.
afterEach(() => cleanup())

// Every page renders inside <AuthProvider>, which immediately requests
// `/api/users/me`. Defaulting it to "signed out" means a test only has to
// mock that endpoint when it actually cares who is signed in.
const defaultHandlers = [
  http.get('/api/users/me', () =>
    HttpResponse.json({ error: { message: 'Not signed in' } }, { status: 401 })
  ),
  // The footer's <ContactEmail> reads this on every page.
  http.get('/api/billing/plan', () => HttpResponse.json({ contactEmail: 'support@tourney.app' })),
]

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers(...defaultHandlers))
afterAll(() => server.close())

server.use(...defaultHandlers)
