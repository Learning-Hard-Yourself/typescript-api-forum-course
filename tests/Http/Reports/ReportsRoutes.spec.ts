import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { createTestApplication } from '@tests/support/createTestApplication'

describe('Reports routes', () => {
    it('creates a report for a thread and lists it for moderators', async () => {
        const { app } = await createTestApplication()

        const reporterId = uuidv7()

        const createResponse = await request(app)
            .post('/api/v1/reports')
            .set('Authorization', 'Bearer test-token')
            .send({
                targetType: 'thread',
                targetId: uuidv7(),
                reportType: 'SPAM',
                description: 'This thread is spam',
                priority: 2,
                reporterId,
            })

        expect(createResponse.statusCode).toBe(201)
        expect(createResponse.body.data).toBeDefined()
        const reportId = createResponse.body.data.id

        const listResponse = await request(app)
            .get('/api/v1/reports')
            .set('Authorization', 'Bearer test-token')

        expect(listResponse.statusCode).toBe(200)
        expect(Array.isArray(listResponse.body.data)).toBe(true)
        expect(listResponse.body.data.find((r: any) => r.id === reportId)).toBeDefined()
    })

    it('resolves a report with a resolution message', async () => {
        const { app } = await createTestApplication()

        const reporterId = uuidv7()

        const createResponse = await request(app)
            .post('/api/v1/reports')
            .set('Authorization', 'Bearer test-token')
            .send({
                targetType: 'user',
                targetId: uuidv7(),
                reportType: 'HARASSMENT',
                description: 'Abusive behavior',
                priority: 3,
                reporterId,
            })

        const reportId = createResponse.body.data.id

        const resolveResponse = await request(app)
            .post(`/api/v1/reports/${reportId}/resolve`)
            .set('Authorization', 'Bearer test-token')
            .send({
                resolution: 'User warned',
            })

        expect(resolveResponse.statusCode).toBe(200)
        expect(resolveResponse.body.data).toMatchObject({
            id: reportId,
            resolution: 'User warned',
            status: 'RESOLVED',
        })
    })
})
