import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('GET /api/categories', () => {
    it('returns all categories in a tree structure', async () => {
        const context = await createTestApplication()

        // Create parent category
        const parentId = uuidv7()
        await context.database.insert(categories).values({
            id: parentId,
            name: 'General',
            slug: 'general',
            description: 'General discussions',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // Create child category
        const childId = uuidv7()
        await context.database.insert(categories).values({
            id: childId,
            name: 'Announcements',
            slug: 'announcements',
            description: 'Official announcements',
            parentId,
            order: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const response = await request(context.app).get('/api/v1/categories').expect(200)

        // Verify HTTP headers
        expect(response.headers['cache-control']).toBe('public, max-age=300')
        expect(response.headers['etag']).toBeDefined()
        expect(response.headers['x-request-id']).toBeDefined()

        expect(response.body.data).toHaveLength(1) // Only root categories
        expect(response.body.data[0]).toMatchObject({
            id: parentId,
            name: 'General',
            slug: 'general',
            description: 'General discussions',
        })
        expect(response.body.data[0].children).toHaveLength(1)
        expect(response.body.data[0].children[0]).toMatchObject({
            id: childId,
            name: 'Announcements',
            slug: 'announcements',
            parentId,
        })
    })

    it('returns empty array when no categories exist', async () => {
        const context = await createTestApplication()

        const response = await request(context.app).get('/api/v1/categories').expect(200)

        // Verify HTTP headers
        expect(response.headers['cache-control']).toBe('public, max-age=300')
        expect(response.headers['x-request-id']).toBeDefined()

        expect(response.body.data).toEqual([])
    })
})
