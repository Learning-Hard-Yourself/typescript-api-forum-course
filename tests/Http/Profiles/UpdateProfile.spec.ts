import { eq } from 'drizzle-orm'
import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { profiles, users } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('PATCH /api/profiles/:userId', () => {
    it('updates profile for a user', async () => {
        const context = await createTestApplication()
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

        const payload = {
            bio: 'Hello world',
            location: 'Earth',
        }

        const response = await request(context.app)
            .patch(`/api/profiles/${userId}`)
            .send(payload)
            .expect(200)

        expect(response.body.data).toMatchObject({
            userId,
            bio: 'Hello world',
            location: 'Earth',
        })

        // Verify DB
        const [profile] = await context.database.select().from(profiles).where(eq(profiles.userId, userId))
        expect(profile).toMatchObject({
            userId,
            bio: 'Hello world',
            location: 'Earth',
        })
    })
})
