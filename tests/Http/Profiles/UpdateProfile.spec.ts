import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { profiles, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('PATCH /api/v1/profiles/:userId', () => {
    it('updates profile for a user', async () => {
        const context = await createTestApplication()

        // Authenticate user
        const cookie = await authenticateUser(context.app, {
            username: 'testuser',
            email: 'test@example.com',
            displayName: 'Test User',
            password: 'SecurePassword123!',
        })

        // Get user ID
        const [user] = await context.database.select().from(users).where(eq(users.email, 'test@example.com'))
        const userId = user.id

        const payload = {
            bio: 'Hello world',
            location: 'Earth',
        }

        const response = await authenticatedRequest(context.app, cookie)
            .patch(`/api/v1/profiles/${userId}`)
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
