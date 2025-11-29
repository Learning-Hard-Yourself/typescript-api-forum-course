import { eq } from 'drizzle-orm'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { categories, users } from '@/config/schema'
import { authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('POST /api/categories', () => {
    it('creates a new category (admin only)', async () => {
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

        const payload = {
            name: 'General Discussion',
            slug: 'general-discussion',
            description: 'Talk about anything',
            order: 1,
        }

        const auth = { accessToken, cookies: Array.isArray(cookies) ? cookies : [cookies] }
        const response = await authenticatedRequest(context.app, auth)
            .post('/api/v1/categories')
            .send(payload)
            .expect(201)

        expect(response.body.data).toMatchObject({
            name: 'General Discussion',
            slug: 'general-discussion',
        })

        
        expect(response.headers['location']).toBe(`/api/v1/categories/${response.body.data.id}`)
        expect(response.headers['x-request-id']).toBeDefined()

        const [category] = await context.database.select().from(categories).where(eq(categories.slug, 'general-discussion'))
        expect(category).toBeDefined()
        expect(category.name).toBe('General Discussion')
    })

    it('returns 401 for unauthenticated users', async () => {
        const context = await createTestApplication()

        const payload = {
            name: 'General Discussion',
            slug: 'general-discussion',
            description: 'Talk about anything',
            order: 1,
        }

        await request(context.app)
            .post('/api/v1/categories')
            .send(payload)
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

        const payload = {
            name: 'General Discussion',
            slug: 'general-discussion',
            description: 'Talk about anything',
            order: 1,
        }

        const auth = { accessToken, cookies: Array.isArray(cookies) ? cookies : [cookies] }
        await authenticatedRequest(context.app, auth)
            .post('/api/v1/categories')
            .send(payload)
            .expect(403)
    })
})
