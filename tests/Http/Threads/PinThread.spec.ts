import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, threads, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('Thread Pinning', () => {
    it('allows moderator to pin and unpin a thread', async () => {
        const context = await createTestApplication()

        // Mod setup
        const auth = await authenticateUser(context.app, {
            username: 'moderator',
            email: 'mod@test.com',
            displayName: 'Mod User',
            password: 'SecurePassword123!',
        })

        await context.database
            .update(users)
            .set({ role: 'moderator' })
            .where(eq(users.email, 'mod@test.com'))

        // Setup Thread
        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'General',
            slug: 'general',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const [modUser] = await context.database.select().from(users).where(eq(users.email, 'mod@test.com'))

        const threadId = uuidv7()
        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId: modUser.id,
            title: 'Pinned Thread',
            slug: 'pinned-thread',
            isPinned: false, // Init false
            isLocked: false,
            viewCount: 0,
            replyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // PIN
        await authenticatedRequest(context.app, auth)
            .post(`/api/v1/threads/${threadId}/pin`)
            .expect(200)

        const [pinnedThread] = await context.database.select().from(threads).where(eq(threads.id, threadId))
        expect(pinnedThread.isPinned).toBe(true)

        // UNPIN
        await authenticatedRequest(context.app, auth)
            .post(`/api/v1/threads/${threadId}/unpin`)
            .expect(200)

        const [unpinnedThread] = await context.database.select().from(threads).where(eq(threads.id, threadId))
        expect(unpinnedThread.isPinned).toBe(false)
    })

    it('returns 403 for regular user', async () => {
        const context = await createTestApplication()

        const auth = await authenticateUser(context.app, {
            username: 'regular',
            email: 'reg@test.com',
            displayName: 'Reg User',
            password: 'SecurePassword123!',
        })

        const [user] = await context.database.select().from(users).where(eq(users.email, 'reg@test.com'))

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
            authorId: user.id,
            title: 'My Thread',
            slug: 'my-thread',
            isPinned: false,
            isLocked: false,
            viewCount: 0,
            replyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        await authenticatedRequest(context.app, auth)
            .post(`/api/v1/threads/${threadId}/pin`)
            .expect(403)
    })
})
