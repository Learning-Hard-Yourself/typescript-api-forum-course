import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const { app } = await createTestApplication()

    const response = await request(app).get('/api/health')

    expect(response.statusCode).toBe(200)
    expect(response.body).toStrictEqual({ status: 'ok' })
  })
})
