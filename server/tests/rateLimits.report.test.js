import { describe, expect, it, vi } from 'vitest'

// Rate limiting is skipped outside production (`enabled = config.isProduction`
// in rateLimits.js) so a full suite firing hundreds of requests never trips
// it. To actually exercise the limiter's behaviour, this file mocks
// `config.isProduction` to true before importing the module — `enabled` is
// evaluated once at import time, so the mock has to be in place first.
vi.mock('../src/config/env.js', () => ({ default: { isProduction: true } }))

const { reportLimiter } = await import('../src/middleware/rateLimits.js')

function fakeReq() {
  return { ip: '203.0.113.7', userId: null }
}

function fakeRes() {
  return {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value
    },
    getHeader() {
      return undefined
    },
  }
}

describe('reportLimiter', () => {
  it('rejects once the caller exceeds the cap in the window', async () => {
    const req = fakeReq()
    let lastError

    // The limiter allows `max` requests; the next one must be rejected. Firing
    // max + 1 and keeping only the last outcome is what actually proves the
    // cap rather than just that the middleware runs.
    for (let i = 0; i < 21; i++) {
      lastError = await new Promise((resolve) => {
        reportLimiter(req, fakeRes(), (error) => resolve(error))
      })
    }

    expect(lastError).toBeTruthy()
    expect(lastError.status).toBe(429)
    expect(lastError.code).toBe('RATE_LIMITED')
  })
})
