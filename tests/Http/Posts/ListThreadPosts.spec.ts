import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, threads, users } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('GET /api/v1/threads/:threadId/posts', () => {
    it('lists posts for a thread', async () => {
        const context = await createTestApplication()

        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'General',
            slug: 'general',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const authorId = uuidv7()
        await context.database.insert(users).values({
            id: authorId,
            username: 'poster',
            email: 'poster@test.com',
            displayName: 'Post User',
            role: 'user',
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        })

        const threadId = uuidv7()
        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId,
            title: 'Thread',
            slug: 'thread',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            replyCount: 0,
            viewCount: 0,
            isLocked: false,
            isPinned: false
        })

        // Create 2 posts
        await context.database.insert(posts).values({
            id: uuidv7(),
            threadId,
            authorId,
            content: 'Post 1',
            voteScore: 10,
            isEdited: false,
            isDeleted: false,
            createdAt: new Date(Date.now() - 1000).toISOString(),
            updatedAt: new Date().toISOString(),
        })

        await context.database.insert(posts).values({
            id: uuidv7(),
            threadId,
            authorId,
            content: 'Post 2',
            voteScore: 5,
            isEdited: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const response = await request(context.app)
            .get(`/api/v1/threads/${threadId}/posts`)
            .expect(200)

        expect(response.body.data).toHaveLength(2)
        // Check sorting or content? Default sort is usually oldest first or threaded but let's just check existence.
        expect(response.body.data[0].content).toBe('Post 1')
        expect(response.body.data[1].content).toBe('Post 2')
    })
})
