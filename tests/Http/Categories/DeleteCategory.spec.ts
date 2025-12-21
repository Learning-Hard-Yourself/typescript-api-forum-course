import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { categories, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('DELETE /api/v1/categories/:id', () => {
    it('deletes a category (admin only)', async () => {
        const context = await createTestApplication()

        const auth = await authenticateUser(context.app, {
            username: 'admindelete',
            email: 'admin.delete@test.com',
            displayName: 'Admin User',
            password: 'SecurePassword123!',
        })

        await context.database
            .update(users)
            .set({ role: 'admin' })
            .where(eq(users.email, 'admin.delete@test.com'))

        // Create Category
        const categoryId = uuidv7()
        await context.database.insert(categories).values({
            id: categoryId,
            name: 'To Delete',
            slug: 'to-delete',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        await authenticatedRequest(context.app, auth)
            .delete(`/api/v1/categories/${categoryId}`)
            .expect(204)

        const [deletedCategory] = await context.database.select().from(categories).where(eq(categories.id, categoryId))
        expect(deletedCategory).toBeUndefined()
    })

    it('returns 403 for non-admin users', async () => {
        const context = await createTestApplication()

        const auth = await authenticateUser(context.app, {
            username: 'regularuser',
            email: 'user.delete@test.com',
            displayName: 'Regular User',
            password: 'SecurePassword123!',
        })

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
            .delete(`/api/v1/categories/${categoryId}`)
            .expect(403)
    })
})
