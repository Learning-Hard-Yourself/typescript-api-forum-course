import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, threads } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('POST /api/threads', () => {
    it('creates a new thread with initial post', async () => {
        const context = await createTestApplication()

        
        const cookie = await authenticateUser(context.app, {
            username: 'testuser',
            email: 'test@example.com',
            displayName: 'Test User',
            password: 'SecurePassword123!',
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

        const payload = {
            categoryId,
            title: 'Hello World',
            content: 'This is the first post content.',
        }

        const response = await authenticatedRequest(context.app, cookie)
            .post('/api/v1/threads')
            .send(payload)
            .expect(201)

        expect(response.body.data).toMatchObject({
            title: 'Hello World',
            categoryId,
        })

        
        expect(response.headers['location']).toBe(`/api/v1/threads/${response.body.data.id}`)
        expect(response.headers['x-request-id']).toBeDefined()

        
        const [thread] = await context.database.select().from(threads).where(eq(threads.id, response.body.data.id))
        expect(thread).toBeDefined()
        expect(thread.title).toBe('Hello World')
        expect(thread.slug).toBe('hello-world') 

        
        const [post] = await context.database.select().from(posts).where(eq(posts.threadId, thread.id))
        expect(post).toBeDefined()
        expect(post.content).toBe('This is the first post content.')
        expect(thread.lastPostId).toBe(post.id)
    })
})
