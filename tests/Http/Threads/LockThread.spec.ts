import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, threads, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('Thread Locking', () => {
    it('allows moderator to lock and unlock a thread', async () => {
        const context = await createTestApplication()

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

        // Setup
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
            title: 'Lockable Thread',
            slug: 'lockable-thread',
            isPinned: false,
            isLocked: false, // Init false
            viewCount: 0,
            replyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // LOCK
        await authenticatedRequest(context.app, auth)
            .post(`/api/v1/threads/${threadId}/lock`)
            .expect(200)

        const [lockedThread] = await context.database.select().from(threads).where(eq(threads.id, threadId))
        expect(lockedThread.isLocked).toBe(true)

        // UNLOCK
        await authenticatedRequest(context.app, auth)
            .post(`/api/v1/threads/${threadId}/unlock`)
            .expect(200)

        const [unlockedThread] = await context.database.select().from(threads).where(eq(threads.id, threadId))
        expect(unlockedThread.isLocked).toBe(false)
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
            .post(`/api/v1/threads/${threadId}/lock`)
            .expect(403)
    })
})
