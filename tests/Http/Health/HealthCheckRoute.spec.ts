import { createTestApplication } from '@tests/support/createTestApplication'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

describe('GET /api/health', () => {
  it('returns healthy status with checks', async () => {
    const { app } = await createTestApplication()

    const response = await request(app).get('/api/v1/health')

    expect(response.statusCode).toBe(200)
    expect(response.body.status).toBe('healthy')
    expect(response.body.checks).toBeDefined()
    expect(response.body.checks.database).toBeDefined()
    expect(response.body.timestamp).toBeDefined()
    expect(response.body.uptime).toBeGreaterThanOrEqual(0)
  })

  it('returns healthy status at /api/v1/health endpoint', async () => {
    const { app } = await createTestApplication()

    const response = await request(app).get('/api/v1/health')

    expect(response.statusCode).toBe(200)
    expect(response.body.status).toBe('healthy')
  })
})
