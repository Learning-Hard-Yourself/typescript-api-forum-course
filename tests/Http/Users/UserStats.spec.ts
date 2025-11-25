import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, threads, users } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('User Stats', () => {
    it('calculates user reputation correctly', async () => {
        const context = await createTestApplication()

        // 1. Setup User
        const userId = 'usr_stats_1'
        await context.database.insert(users).values({
            id: userId,
            username: 'stats_user',
            email: 'stats@example.com',
            displayName: 'Stats User',
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        })

        // 2. Create Category
        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'General',
            slug: 'general',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // 3. Create Thread (5 points)
        const threadId = uuidv7()
        await context.database.insert(threads).values({
            id: threadId,
            categoryId,
            authorId: userId,
            title: 'My Thread',
            slug: 'my-thread',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // 4. Create Post (2 points)
        const postId = uuidv7()
        await context.database.insert(posts).values({
            id: postId,
            threadId,
            authorId: userId,
            content: 'My Post',
            voteScore: 10, // +10 points from votes
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // 5. Verify Stats via API
        // Expected Reputation: (1 Thread * 5) + (1 Post * 2) + (10 Vote Score) = 17
        const response = await request(context.app)
            .get(`/api/v1/users/${userId}/stats`)
            .expect(200)

        expect(response.body.data).toMatchObject({
            threadCount: 1,
            postCount: 1,
            reputation: 17,
        })
    })
})
