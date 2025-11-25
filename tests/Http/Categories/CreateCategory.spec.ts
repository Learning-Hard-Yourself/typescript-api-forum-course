import { eq } from 'drizzle-orm'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { categories } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('POST /api/categories', () => {
    it('creates a new category', async () => {
        const context = await createTestApplication()

        const payload = {
            name: 'General Discussion',
            slug: 'general-discussion',
            description: 'Talk about anything',
            order: 1,
        }

        const response = await request(context.app)
            .post('/api/categories')
            .send(payload)
            .expect(201)

        expect(response.body.data).toMatchObject({
            name: 'General Discussion',
            slug: 'general-discussion',
        })

        const [category] = await context.database.select().from(categories).where(eq(categories.slug, 'general-discussion'))
        expect(category).toBeDefined()
        expect(category.name).toBe('General Discussion')
    })
})
