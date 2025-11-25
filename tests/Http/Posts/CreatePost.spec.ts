import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, threads, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('POST /api/posts', () => {
    it('creates a new post and updates thread stats', async () => {
        const context = await createTestApplication()

        // Authenticate user
        const cookie = await authenticateUser(context.app, {
            username: 'testuser',
            email: 'test@example.com',
            displayName: 'Test User',
            password: 'SecurePassword123!',
        })

        // Get authenticated user ID from database
        const [user] = await context.database.select().from(users).where(eq(users.email, 'test@example.com'))
        const userId = user.id

        // Create category
        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'General',
            slug: 'general',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // Create thread
        const threadId = uuidv7()
        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId: userId,
            title: 'Test Thread',
            slug: 'test-thread',
            replyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const payload = {
            threadId,
            content: 'This is a reply.',
        }

        const response = await authenticatedRequest(context.app, cookie)
            .post('/api/v1/posts')
            .send(payload)
            .expect(201)

        expect(response.body.data).toMatchObject({
            threadId,
            content: 'This is a reply.',
        })

        // Verify Post
        const [post] = await context.database.select().from(posts).where(eq(posts.id, response.body.data.id))
        expect(post).toBeDefined()
        expect(post.content).toBe('This is a reply.')

        // Verify Thread Stats
        const [thread] = await context.database.select().from(threads).where(eq(threads.id, threadId))
        expect(thread.replyCount).toBe(1)
        expect(thread.lastPostId).toBe(post.id)
    })
})
