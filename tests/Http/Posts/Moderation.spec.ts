import { eq } from 'drizzle-orm'
import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, users } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('Post Moderation', () => {
    it('allows editing a post and tracks history', async () => {
        const context = await createTestApplication()

        // 1. Setup Data
        const userId = 'usr_1'
        await context.database.insert(users).values({
            id: userId,
            username: 'author',
            email: 'author@example.com',
            displayName: 'Author',
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // Create thread via API to get a post
        const threadRes = await request(context.app)
            .post('/api/threads')
            .send({
                categoryId,
                title: 'Test Thread',
                content: 'Original content',
            })

        const postId = threadRes.body.data.lastPostId

        // 2. Edit Post
        const editRes = await request(context.app)
            .patch(`/api/posts/${postId}`)
            .send({
                content: 'Updated content',
                reason: 'Fixing typo'
            })
            .expect(200)

        expect(editRes.body.data.content).toBe('Updated content')
        expect(editRes.body.data.isEdited).toBe(true)

        // 3. Verify DB
        const [post] = await context.database.select().from(posts).where(eq(posts.id, postId))
        expect(post.content).toBe('Updated content')
        expect(post.isEdited).toBe(true)

        // 4. Verify History Endpoint
        const historyRes = await request(context.app)
            .get(`/api/posts/${postId}/history`)
            .expect(200)

        expect(historyRes.body.data).toHaveLength(1)
        const entry = historyRes.body.data[0]
        // Tuple: [timestamp, editorId, previousContent, newContent, reason]
        expect(entry[1]).toBe(userId)
        expect(entry[2]).toBe('Original content')
        expect(entry[3]).toBe('Updated content')
        expect(entry[4]).toBe('Fixing typo')
    })

    it('allows soft deleting and restoring a post', async () => {
        const context = await createTestApplication()

        // 1. Setup Data (simplified)
        const userId = 'usr_1'
        await context.database.insert(users).values({
            id: userId,
            username: 'author',
            email: 'author@example.com',
            displayName: 'Author',
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const threadRes = await request(context.app)
            .post('/api/threads')
            .send({ categoryId, title: 'Delete Me', content: 'To be deleted' })

        const postId = threadRes.body.data.lastPostId

        // 2. Soft Delete
        await request(context.app)
            .delete(`/api/posts/${postId}`)
            .send({ reason: 'Spam' })
            .expect(204)

        // Verify DB state
        const [deletedPost] = await context.database.select().from(posts).where(eq(posts.id, postId))
        expect(deletedPost.isDeleted).toBe(true)
        expect(deletedPost.deletedBy).toBe(userId)
        expect(deletedPost.deletedAt).toBeDefined()

        // 3. Restore
        const restoreRes = await request(context.app)
            .post(`/api/posts/${postId}/restore`)
            .expect(200)

        expect(restoreRes.body.data.isDeleted).toBe(false)

        // Verify DB state
        const [restoredPost] = await context.database.select().from(posts).where(eq(posts.id, postId))
        expect(restoredPost.isDeleted).toBe(false)
        expect(restoredPost.deletedAt).toBeNull()
        expect(restoredPost.deletedBy).toBeNull()
    })
})
