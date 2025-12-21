import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, threads, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('POST /api/v1/posts/:id/reply', () => {
    it('creates a reply to a post', async () => {
        const context = await createTestApplication()

        const auth = await authenticateUser(context.app, {
            username: 'replier',
            email: 'reply@test.com',
            displayName: 'Reply User',
            password: 'SecurePassword123!',
        })

        const [user] = await context.database.select().from(users).where(eq(users.email, 'reply@test.com'))

        // Create Thread/Post
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
            title: 'Thread',
            slug: 'thread',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            replyCount: 0,
            viewCount: 0,
            isLocked: false,
            isPinned: false
        })

        const parentPostId = uuidv7()
        await context.database.insert(posts).values({
            id: parentPostId,
            threadId,
            authorId: user.id,
            content: 'Parent Post',
            voteScore: 0,
            isEdited: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const response = await authenticatedRequest(context.app, auth)
            .post(`/api/v1/posts/${parentPostId}/reply`)
            .send({
                content: 'This is a reply'
            })
            .expect(201)

        expect(response.body.data).toMatchObject({
            content: 'This is a reply',
            parentPostId,
            threadId
        })

        // Check DB
        const [reply] = await context.database.select().from(posts).where(eq(posts.id, response.body.data.id))
        expect(reply).toBeDefined()
        expect(reply.parentPostId).toBe(parentPostId)

        // Check thread reply count updated
        const [updatedThread] = await context.database.select().from(threads).where(eq(threads.id, threadId))
        expect(updatedThread.replyCount).toBe(1)
        expect(updatedThread.lastPostId).toBe(reply.id)
    })
})
