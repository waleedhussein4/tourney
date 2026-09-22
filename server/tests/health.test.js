import { describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { guest } from './setup/api.js'

useDatabase()

describe('GET /api/health', () => {
  it('reports status, database, and the new config flags as booleans', async () => {
    const { body } = await guest().get('/api/health').expect(200)

    expect(body.status).toBe('ok')
    expect(body.database).toBe('connected')
    expect(typeof body.emailConfigured).toBe('boolean')
    expect(typeof body.paymentsEnabled).toBe('boolean')
  })
})

describe('request id', () => {
  it('generates and echoes back a request id when none is sent', async () => {
    const res = await guest().get('/api/health').expect(200)

    expect(res.headers['x-request-id']).toBeTruthy()
  })

  it('preserves an inbound request id instead of replacing it', async () => {
    const res = await guest()
      .get('/api/health')
      .set('x-request-id', 'test-request-id-123')
      .expect(200)

    expect(res.headers['x-request-id']).toBe('test-request-id-123')
  })
})
