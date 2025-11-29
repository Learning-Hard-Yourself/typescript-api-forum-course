import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, posts, threads, users } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('User Stats', () => {
    it('calculates user reputation correctly', async () => {
        const context = await createTestApplication()

        
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
            title: 'My Thread',
            slug: 'my-thread',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        
        const postId = uuidv7()
        await context.database.insert(posts).values({
            id: postId,
            threadId,
            authorId: userId,
            content: 'My Post',
            voteScore: 10, 
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        
        
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
