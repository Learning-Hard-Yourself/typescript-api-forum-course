import { eq } from 'drizzle-orm'
import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, threads, users } from '@/database/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('POST /api/posts', () => {
    it('creates a new post and updates thread stats', async () => {
        const context = await createTestApplication()

        // Setup: User, Category and Thread
        const userId = 'usr_1'
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

        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'General',
            slug: 'general',
            order: 0,
        })

        const threadId = uuidv7()
        const initialPostId = uuidv7()
        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId: 'usr_1',
            title: 'Hello World',
            slug: 'hello-world',
            lastPostId: null, // Initially null
            replyCount: 0,
            viewCount: 0,
        })

        // Create initial post
        await context.database.insert(posts).values({
            id: initialPostId,
            threadId,
            authorId: 'usr_1',
            content: 'First post',
        })

        // Update thread with lastPostId
        await context.database.update(threads).set({ lastPostId: initialPostId }).where(eq(threads.id, threadId))

        const payload = {
            threadId,
            content: 'This is a reply.',
        }

        const response = await request(context.app)
            .post('/api/posts')
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
