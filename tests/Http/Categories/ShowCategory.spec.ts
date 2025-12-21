import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('GET /api/v1/categories/:id', () => {
    it('returns a category by ID', async () => {
        const context = await createTestApplication()

        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'Tech',
            slug: 'tech',
            description: 'Technology discussions',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const response = await request(context.app)
            .get(`/api/v1/categories/${categoryId}`)
            .expect(200)

        expect(response.body.data).toMatchObject({
            id: categoryId,
            name: 'Tech',
            slug: 'tech',
            description: 'Technology discussions',
        })
    })

    it('returns 404 if category does not exist', async () => {
        const context = await createTestApplication()
        const nonExistentId = uuidv7()

        await request(context.app)
            .get(`/api/v1/categories/${nonExistentId}`)
            .expect(404)
    })
})
