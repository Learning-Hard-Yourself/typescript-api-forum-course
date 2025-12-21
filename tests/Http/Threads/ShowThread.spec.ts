import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, threads, users } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('GET /api/v1/threads/:id', () => {
    it('returns a thread by ID with author and category', async () => {
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
            username: 'threadauthor',
            email: 'author@test.com',
            displayName: 'Thread Author',
            role: 'user',
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        })

        const threadId = uuidv7()
        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId,
            title: 'Hello World',
            slug: 'hello-world',
            isPinned: false,
            isLocked: false,
            viewCount: 10,
            replyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const response = await request(context.app)
            .get(`/api/v1/threads/${threadId}`)
            .expect(200)

        expect(response.body.data).toMatchObject({
            id: threadId,
            title: 'Hello World',
            slug: 'hello-world',
            viewCount: 10, // View count does not increment on show?
            author: { id: authorId, username: 'threadauthor' },
            category: { id: categoryId, name: 'General' }
        })
    })

    it('returns 404 if thread does not exist', async () => {
        const context = await createTestApplication()
        const nonExistentId = uuidv7()

        await request(context.app)
            .get(`/api/v1/threads/${nonExistentId}`)
            .expect(404)
    })
})
