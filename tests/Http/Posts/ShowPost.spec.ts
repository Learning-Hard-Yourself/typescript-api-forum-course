import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, threads, users } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('GET /api/v1/posts/:id', () => {
    it('returns a post by ID (with author)', async () => {
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
            username: 'postauthor',
            email: 'author@test.com',
            displayName: 'Post Author',
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

        const postId = uuidv7()
        await context.database.insert(posts).values({
            id: postId,
            threadId,
            authorId,
            content: 'Hello Post',
            voteScore: 42,
            isEdited: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const response = await request(context.app)
            .get(`/api/v1/posts/${postId}`)
            .expect(200)

        expect(response.body.data).toMatchObject({
            id: postId,
            content: 'Hello Post',
            voteScore: 42,
            authorId: authorId
        })
    })

    it('returns 404 if post does not exist', async () => {
        const context = await createTestApplication()
        const nonExistentId = uuidv7()

        await request(context.app)
            .get(`/api/v1/posts/${nonExistentId}`)
            .expect(404)
    })
})
