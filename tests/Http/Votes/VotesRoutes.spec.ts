import { eq } from 'drizzle-orm'
import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, threads, users, votes } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

const createUserThreadAndPost = async () => {
    const context = await createTestApplication()

    const cookie = await authenticateUser(context.app, {
        username: 'voter',
        email: 'voter@example.com',
        displayName: 'Voter User',
        password: 'SecurePassword123!',
    })

    const [user] = await context.database.select().from(users).where(eq(users.email, 'voter@example.com'))
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
        title: 'Vote Thread',
        slug: 'vote-thread',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    })

    const postId = uuidv7()
    await context.database.insert(posts).values({
        id: postId,
        threadId,
        authorId: userId,
        content: 'Post to be voted',
        voteScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    })

    return { context, cookie, postId, userId }
}

describe('Votes routes', () => {
    it('casts an upvote on a post and updates voteScore', async () => {
        const { context, cookie, postId } = await createUserThreadAndPost()

        const response = await authenticatedRequest(context.app, cookie)
            .post(`/api/v1/posts/${postId}/vote`)
            .send({ voteType: 'upvote' })

        expect(response.statusCode).toBe(200)
        expect(response.body.data.vote).toBeDefined()
        expect(response.body.data.postScore).toBe(1)

        const [post] = await context.database.select().from(posts).where(eq(posts.id, postId))
        expect(post.voteScore).toBe(1)

        const voteRecord = await context.database.select().from(votes).where(eq(votes.postId, postId))
        expect(voteRecord).toHaveLength(1)
        expect(voteRecord[0].voteType).toBe('upvote')
    })

    it('removes an existing vote', async () => {
        const { context, cookie, postId } = await createUserThreadAndPost()

        await authenticatedRequest(context.app, cookie)
            .post(`/api/v1/posts/${postId}/vote`)
            .send({ voteType: 'upvote' })

        const response = await authenticatedRequest(context.app, cookie)
            .delete(`/api/v1/posts/${postId}/vote`)

        expect(response.statusCode).toBe(200)
        expect(response.body.message).toBe('Vote removed')

        const [post] = await context.database.select().from(posts).where(eq(posts.id, postId))
        expect(post.voteScore).toBe(0)

        const voteRecord = await context.database
            .select()
            .from(votes)
            .where(eq(votes.postId, postId))

        expect(voteRecord).toHaveLength(0)
    })

    it('returns aggregated vote score for a post', async () => {
        const { context, postId } = await createUserThreadAndPost()

        const otherUserId = uuidv7()
        await context.database.insert(users).values({
            id: otherUserId,
            username: 'other',
            email: 'other@example.com',
            displayName: 'Other User',
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        })

        await context.database.insert(votes).values([
            { id: uuidv7(), userId: otherUserId, postId, voteType: 'upvote', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ])

        const response = await request(context.app)
            .get(`/api/v1/posts/${postId}/votes`)

        expect(response.statusCode).toBe(200)
        expect(response.body.data.score).toBe(1)
    })
})
