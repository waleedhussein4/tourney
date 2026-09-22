import { setupServer } from 'msw/node'

// Started once for the whole run and reset between tests in setup.js. Each
// test file registers the handlers it needs with `server.use(...)`; nothing
// here is a default success response, so a test that forgets to mock an
// endpoint fails loudly with an MSW "unhandled request" warning instead of
// silently hitting the real network.
export const server = setupServer()
