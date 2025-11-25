import { eq } from 'drizzle-orm'
import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, threads, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('Post Moderation', () => {
    it('allows editing a post and tracks history', async () => {
        const context = await createTestApplication()

        // 1. Authenticate user
        const cookie = await authenticateUser(context.app, {
            username: 'author',
            email: 'author@example.com',
            displayName: 'Author',
            password: 'SecurePassword123!',
        })

        // Get user ID
        const [user] = await context.database.select().from(users).where(eq(users.email, 'author@example.com'))
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

        // Create thread and post directly in DB
        const threadId = uuidv7()
        const postId = uuidv7()

        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId: userId,
            title: 'Test Thread',
            slug: 'test-thread',
            replyCount: 0,
            lastPostId: postId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        await context.database.insert(posts).values({
            id: postId,
            threadId,
            authorId: userId,
            content: 'Original content',
            voteScore: 0,
            isEdited: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // 2. Edit Post (authenticated)
        const editRes = await authenticatedRequest(context.app, cookie)
            .patch(`/api/v1/posts/${postId}`)
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
            .get(`/api/v1/posts/${postId}/history`)
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

        // 1. Authenticate user
        const cookie = await authenticateUser(context.app, {
            username: 'author2',
            email: 'author2@example.com',
            displayName: 'Author',
            password: 'SecurePassword123!',
        })

        // Get user ID
        const [user] = await context.database.select().from(users).where(eq(users.email, 'author2@example.com'))
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

        // Create thread and post directly in DB
        const threadId = uuidv7()
        const postId = uuidv7()

        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId: userId,
            title: 'Delete Me',
            slug: 'delete-me',
            replyCount: 0,
            lastPostId: postId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        await context.database.insert(posts).values({
            id: postId,
            threadId,
            authorId: userId,
            content: 'To be deleted',
            voteScore: 0,
            isEdited: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // 2. Soft Delete (authenticated)
        await authenticatedRequest(context.app, cookie)
            .delete(`/api/v1/posts/${postId}`)
            .send({ reason: 'Spam' })
            .expect(204)

        // Verify DB state
        const [deletedPost] = await context.database.select().from(posts).where(eq(posts.id, postId))
        expect(deletedPost.isDeleted).toBe(true)
        expect(deletedPost.deletedBy).toBe(userId)
        expect(deletedPost.deletedAt).toBeDefined()

        // 3. Restore (authenticated)
        await authenticatedRequest(context.app, cookie)
            .post(`/api/v1/posts/${postId}/restore`)
            .expect(200)



        // Verify DB state
        const [restoredPost] = await context.database.select().from(posts).where(eq(posts.id, postId))
        expect(restoredPost.isDeleted).toBe(false)
        expect(restoredPost.deletedAt).toBeNull()
        expect(restoredPost.deletedBy).toBeNull()
    })
})
