import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The mailer reads config at import time, so mock env.js before importing it.
vi.mock('../src/config/env.js', () => ({
  default: {
    nodeEnv: 'production',
    resend: { apiKey: 'test-key', mailFrom: 'noreply@example.com', configured: true },
  },
}))

const { sendMail } = await import('../src/lib/mailer.js')

function jsonResponse(status) {
  return { ok: status >= 200 && status < 300, status }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('sendMail', () => {
  it('retries once on a 500 and succeeds on the second attempt', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(500)).mockResolvedValueOnce(jsonResponse(200))

    await expect(
      sendMail({ to: 'a@example.com', subject: 'hi', text: 'body' })
    ).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('does not retry on a 422', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(422))

    await expect(sendMail({ to: 'a@example.com', subject: 'hi', text: 'body' })).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('surfaces a timeout as a failure rather than hanging', async () => {
    fetch.mockImplementation(() => {
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      return Promise.reject(error)
    })

    await expect(sendMail({ to: 'a@example.com', subject: 'hi', text: 'body' })).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(2) // one retry, both timed out
  })

  it('does not throw when a non-critical send fails', async () => {
    fetch.mockResolvedValue(jsonResponse(500))

    await expect(
      sendMail({ to: 'a@example.com', subject: 'hi', text: 'body', critical: false })
    ).resolves.toBeUndefined()
  })
})
