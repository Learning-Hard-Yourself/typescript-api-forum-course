import supertest from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, threads, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('GET /api/v1/threads', () => {
    it('returns threads with cursor pagination', async () => {
        const context = await createTestApplication()

        // Authenticate user
        const cookie = await authenticateUser(context.app, {
            username: 'testuser',
            email: 'test@example.com',
            displayName: 'Test User',
            password: 'SecurePassword123!',
        })

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

        // Get the authenticated user's ID
        const [user] = await context.database.select().from(users).limit(1)
        const authorId = user.id

        // Create multiple threads
        const threadIds: string[] = []
        for (let i = 0; i < 5; i++) {
            const threadId = uuidv7()
            threadIds.push(threadId)
            await context.database.insert(threads).values({
                id: threadId,
                categoryId,
                authorId,
                title: `Thread ${i + 1}`,
                slug: `thread-${i + 1}`,
                isPinned: false,
                isLocked: false,
                viewCount: 0,
                replyCount: 0,
                createdAt: new Date(Date.now() - (5 - i) * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
            })
        }

        // Fetch first page
        const response = await authenticatedRequest(context.app, cookie)
            .get('/api/v1/threads?first=2')
            .expect(200)

        // Verify cursor pagination structure
        expect(response.body).toHaveProperty('edges')
        expect(response.body).toHaveProperty('pageInfo')
        expect(response.body.edges).toHaveLength(2)
        expect(response.body.pageInfo.hasNextPage).toBe(true)
        expect(response.body.pageInfo.hasPreviousPage).toBe(false)
        expect(response.body.pageInfo.endCursor).toBeDefined()

        // Each edge should have node and cursor
        expect(response.body.edges[0]).toHaveProperty('node')
        expect(response.body.edges[0]).toHaveProperty('cursor')
        expect(response.body.edges[0].node).toHaveProperty('id')
        expect(response.body.edges[0].node).toHaveProperty('title')

        // Fetch next page using cursor
        const nextCursor = response.body.pageInfo.endCursor
        const nextResponse = await authenticatedRequest(context.app, cookie)
            .get(`/api/v1/threads?first=2&after=${nextCursor}`)
            .expect(200)

        expect(nextResponse.body.edges).toHaveLength(2)
        expect(nextResponse.body.pageInfo.hasPreviousPage).toBe(true)

        // Verify HTTP headers
        expect(response.headers['x-request-id']).toBeDefined()
    })

    it('returns empty edges when no threads exist', async () => {
        const context = await createTestApplication()

        const response = await supertest(context.app)
            .get('/api/v1/threads')
            .expect(200)

        const body = response.body
        expect(body.edges).toHaveLength(0)
        expect(body.pageInfo.hasNextPage).toBe(false)
        expect(body.pageInfo.hasPreviousPage).toBe(false)
        expect(body.pageInfo.startCursor).toBeNull()
        expect(body.pageInfo.endCursor).toBeNull()
    })

    it('filters by categoryId', async () => {
        const context = await createTestApplication()

        // Create user for thread author
        const authorId = uuidv7()
        await context.database.insert(users).values({
            id: authorId,
            username: 'author',
            email: 'author@test.com',
            displayName: 'Author',
            role: 'user',
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        })

        // Create two categories
        const categoryId1 = uuidv7()
        const categoryId2 = uuidv7()

        await context.database.insert(categories).values([
            { id: categoryId1, name: 'Cat 1', slug: 'cat-1', order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: categoryId2, name: 'Cat 2', slug: 'cat-2', order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ])

        // Create threads in different categories
        await context.database.insert(threads).values([
            { id: uuidv7(), categoryId: categoryId1, authorId, title: 'Thread in Cat 1', slug: 'thread-cat-1', isPinned: false, isLocked: false, viewCount: 0, replyCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: uuidv7(), categoryId: categoryId2, authorId, title: 'Thread in Cat 2', slug: 'thread-cat-2', isPinned: false, isLocked: false, viewCount: 0, replyCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ])

        const response = await supertest(context.app)
            .get(`/api/v1/threads?categoryId=${categoryId1}`)
            .expect(200)

        const body = response.body
        expect(body.edges).toHaveLength(1)
        expect(body.edges[0].node.categoryId).toBe(categoryId1)
    })
})
