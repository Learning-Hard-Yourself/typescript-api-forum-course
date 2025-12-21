import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('PATCH /api/v1/categories/:id', () => {
    it('updates a category (admin only)', async () => {
        const context = await createTestApplication()

        const auth = await authenticateUser(context.app, {
            username: 'adminupdate',
            email: 'admin.update@test.com',
            displayName: 'Admin User',
            password: 'SecurePassword123!',
        })

        await context.database
            .update(users)
            .set({ role: 'admin' })
            .where(eq(users.email, 'admin.update@test.com'))

        // Create Category
        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'Old Name',
            slug: 'old-name',
            description: 'Old Desc',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        const response = await authenticatedRequest(context.app, auth)
            .patch(`/api/v1/categories/${categoryId}`)
            .send({
                name: 'New Name',
                description: 'New Desc'
            })
            .expect(200)

        expect(response.body.data).toMatchObject({
            id: categoryId,
            name: 'New Name',
            slug: 'old-name', // Slug shouldn't change unless specified? Or maybe it auto-updates? Usually slugs are stable. Let's assume stable for now.
            description: 'New Desc',
        })

        const [updatedCategory] = await context.database.select().from(categories).where(eq(categories.id, categoryId))
        expect(updatedCategory.name).toBe('New Name')
        expect(updatedCategory.description).toBe('New Desc')
    })

    it('returns 403 for non-admin users', async () => {
        const context = await createTestApplication()

        const auth = await authenticateUser(context.app, {
            username: 'regularuser',
            email: 'user.update@test.com',
            displayName: 'Regular User',
            password: 'SecurePassword123!',
        })

        // Create Category
        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'Protected',
            slug: 'protected',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        await authenticatedRequest(context.app, auth)
            .patch(`/api/v1/categories/${categoryId}`)
            .send({ name: 'Hacked' })
            .expect(403)
    })
})
