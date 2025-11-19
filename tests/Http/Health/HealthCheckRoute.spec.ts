import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { Application } from '@/bootstrap/Application'

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const application = new Application()
    const app = await application.create()

    const response = await request(app).get('/api/health')

    expect(response.statusCode).toBe(200)
    expect(response.body).toStrictEqual({ status: 'ok' })
  })
})
