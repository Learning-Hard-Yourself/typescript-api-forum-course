import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, threads, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('PATCH /api/v1/threads/:id', () => {
    it('updates a thread (owner only checks)', async () => {
        const context = await createTestApplication()

        const auth = await authenticateUser(context.app, {
            username: 'threadowner',
            email: 'owner@test.com',
            displayName: 'Owner User',
            password: 'SecurePassword123!',
        })

        const [user] = await context.database.select().from(users).where(eq(users.email, 'owner@test.com'))

        // Create Category
        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'General',
            slug: 'general',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // Create Thread
        const threadId = uuidv7()
        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId: user.id,
            title: 'Original Title',
            slug: 'original-title',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            replyCount: 0,
            viewCount: 0,
            isLocked: false,
            isPinned: false
        })

        const response = await authenticatedRequest(context.app, auth)
            .patch(`/api/v1/threads/${threadId}`)
            .send({
                title: 'Updated Title',
            })
            .expect(200)

        expect(response.body.data.title).toBe('Updated Title')

        const [updatedThread] = await context.database.select().from(threads).where(eq(threads.id, threadId))
        expect(updatedThread.title).toBe('Updated Title')

        // Slug typically regenerates on title change depending on logic, let's verify if it's expected or not.
        // Assuming current implementation updates slug if title changes (common) or kept if not provided. Use case check needed to confirm behavior.
        // Let's assume for now we only check title update.
    })

    it('returns 403 for non-owner', async () => {
        const context = await createTestApplication()

        // Create another user as owner
        const ownerId = uuidv7()
        await context.database.insert(users).values({
            id: ownerId,
            username: 'realowner',
            email: 'real@test.com',
            displayName: 'Real Owner',
            role: 'user',
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        })

        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'General',
            slug: 'general',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const threadId = uuidv7()
        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId: ownerId,
            title: 'Touch This',
            slug: 'touch-this',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            replyCount: 0,
            viewCount: 0,
            isLocked: false,
            isPinned: false
        })

        const auth = await authenticateUser(context.app, {
            username: 'hacker',
            email: 'hacker@test.com',
            displayName: 'Hacker User',
            password: 'SecurePassword123!',
        })

        await authenticatedRequest(context.app, auth)
            .patch(`/api/v1/threads/${threadId}`)
            .send({ title: 'Hacked Title' })
            .expect(403)
    })
})
