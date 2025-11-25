import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { profiles, users } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('GET /api/profiles/:userId', () => {
    it('retrieves a user profile', async () => {
        const context = await createTestApplication()

        // Create user
        const userId = uuidv7()
        await context.database.insert(users).values({
            id: userId,
            username: 'testuser',
            email: 'test@example.com',
            displayName: 'Test User',
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        })

        // Create profile
        await context.database.insert(profiles).values({
            userId,
            bio: 'Software developer',
            location: 'San Francisco',
            website: 'https://example.com',
        })

        const response = await request(context.app).get(`/api/profiles/${userId}`).expect(200)

        expect(response.body.data).toMatchObject({
            userId,
            bio: 'Software developer',
            location: 'San Francisco',
            website: 'https://example.com',
        })
    })

    it('returns 404 when user does not exist', async () => {
        const context = await createTestApplication()
        const nonExistentId = uuidv7()

        const response = await request(context.app).get(`/api/profiles/${nonExistentId}`).expect(404)

        expect(response.body.message).toBe('Profile not found')
    })
})
