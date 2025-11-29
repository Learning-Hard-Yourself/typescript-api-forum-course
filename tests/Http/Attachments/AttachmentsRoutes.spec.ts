import { eq } from 'drizzle-orm'
import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { beforeEach, describe, expect, it } from 'vitest'

import { attachments, categories, posts, threads, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

let context: Awaited<ReturnType<typeof createTestApplication>>

describe('Attachment routes', () => {
    beforeEach(async () => {
        context = await createTestApplication()
    })

    it('generates a presigned URL for uploads', async () => {

        const response = await request(context.app)
            .post('/api/v1/attachments/sign')
            .send({
                filename: 'avatar.png',
                mimeType: 'image/png',
            })

        expect(response.statusCode).toBe(200)
        expect(typeof response.body.url).toBe('string')
        expect(typeof response.body.key).toBe('string')
        expect(response.body.url.length).toBeGreaterThan(0)
        expect(response.body.key.length).toBeGreaterThan(0)
    })

    it('creates an attachment record for a post', async () => {
        const cookie = await authenticateUser(context.app, {
            username: 'att_user',
            email: 'att@test.com',
            displayName: 'Attachment User',
            password: 'SecurePassword123!',
        })

        const [user] = await context.database.select().from(users).where(eq(users.email, 'att@test.com'))
        const userId = user.id

        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'General',
            slug: 'general',
            description: 'Attachments',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const threadId = uuidv7()
        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId: userId,
            title: 'Thread with attachment',
            slug: 'thread-with-attachment',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const postId = uuidv7()
        await context.database.insert(posts).values({
            id: postId,
            threadId,
            authorId: userId,
            content: 'Post that will have an attachment',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const payload = {
            postId,
            filename: 'avatar.png',
            mimeType: 'image/png',
            size: 1024,
            url: 'https://cdn.example.com/uploads/avatar.png',
        }

        const response = await authenticatedRequest(context.app, cookie)
            .post('/api/v1/attachments')
            .send(payload)

        expect(response.statusCode).toBe(201)
        expect(response.body.data).toMatchObject({
            postId,
            filename: 'avatar.png',
            mimeType: 'image/png',
            url: 'https://cdn.example.com/uploads/avatar.png',
        })

        const [attachment] = await context.database.select().from(attachments).where(eq(attachments.postId, postId))
        expect(attachment).toMatchObject({
            postId,
            filename: 'avatar.png',
            mimeType: 'image/png',
            url: 'https://cdn.example.com/uploads/avatar.png',
        })
    })
})
