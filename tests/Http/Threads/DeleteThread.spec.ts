import { eq } from 'drizzle-orm'
import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, threads, users } from '@/config/schema'
import { authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'


describe('DELETE /api/v1/threads/:id', () => {
    it('deletes a thread when user is admin', async () => {
        const context = await createTestApplication()

        const registerResponse = await request(context.app)
            .post('/api/v1/auth/register')
            .send({
                username: 'adminuser',
                email: 'admin@test.com',
                displayName: 'Admin User',
                password: 'SecurePassword123!',
            })
            .expect(201)

        const accessToken = registerResponse.body.data?.accessToken
        const cookies = registerResponse.headers['set-cookie']

        await context.database
            .update(users)
            .set({ role: 'admin' })
            .where(eq(users.email, 'admin@test.com'))

        const [user] = await context.database.select().from(users).where(eq(users.email, 'admin@test.com'))
        const userId = user.id

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
            authorId: userId,
            title: 'Thread to delete',
            slug: 'thread-to-delete',
            isPinned: false,
            isLocked: false,
            viewCount: 0,
            replyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const auth = { accessToken, cookies: Array.isArray(cookies) ? cookies : [cookies] }

        await authenticatedRequest(context.app, auth)
            .delete(`/api/v1/threads/${threadId}`)
            .expect(204)

        const [deletedThread] = await context.database.select().from(threads).where(eq(threads.id, threadId))
        expect(deletedThread).toBeUndefined()
    })

    it('returns 401 for unauthenticated users', async () => {
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
            username: 'unauth',
            email: 'unauth@test.com',
            displayName: 'Unauth User',
            role: 'user',
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        })

        const threadId = uuidv7()
        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId,
            title: 'Thread unauth',
            slug: 'thread-unauth',
            isPinned: false,
            isLocked: false,
            viewCount: 0,
            replyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        await request(context.app)
            .delete(`/api/v1/threads/${threadId}`)
            .expect(401)
    })

    it('returns 403 for non-admin users', async () => {
        const context = await createTestApplication()

        const registerResponse = await request(context.app)
            .post('/api/v1/auth/register')
            .send({
                username: 'regularuser',
                email: 'user@test.com',
                displayName: 'Regular User',
                password: 'SecurePassword123!',
            })
            .expect(201)

        const accessToken = registerResponse.body.data?.accessToken
        const cookies = registerResponse.headers['set-cookie']

        const [user] = await context.database.select().from(users).where(eq(users.email, 'user@test.com'))
        const userId = user.id

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
            authorId: userId,
            title: 'Protected thread',
            slug: 'protected-thread',
            isPinned: false,
            isLocked: false,
            viewCount: 0,
            replyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const auth = { accessToken, cookies: Array.isArray(cookies) ? cookies : [cookies] }

        await authenticatedRequest(context.app, auth)
            .delete(`/api/v1/threads/${threadId}`)
            .expect(403)
    })
})
