import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { notifications, users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('Notifications', () => {
    it('allows retrieving user notifications', async () => {
        const context = await createTestApplication()

        
        const cookie = await authenticateUser(context.app, {
            username: 'user',
            email: 'user@example.com',
            displayName: 'User',
            password: 'SecurePassword123!',
        })

        
        const [user] = await context.database.select().from(users).where(eq(users.email, 'user@example.com'))
        const userId = user.id

        
        const notificationId = uuidv7()
        await context.database.insert(notifications).values({
            id: notificationId,
            userId,
            type: 'system',
            data: { type: 'system', message: 'Welcome!', level: 'info' },
            createdAt: new Date().toISOString(),
        })

        
        const response = await authenticatedRequest(context.app, cookie)
            .get('/api/v1/notifications')
            .expect(200)

        
        expect(response.headers['x-request-id']).toBeDefined()

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].id).toBe(notificationId)
        expect(response.body.data[0].formattedMessage).toBe('System Alert: Welcome!')
    })

    it('allows marking notification as read', async () => {
        const context = await createTestApplication()

        
        const cookie = await authenticateUser(context.app, {
            username: 'user2',
            email: 'user2@example.com',
            displayName: 'User',
            password: 'SecurePassword123!',
        })

        
        const [user] = await context.database.select().from(users).where(eq(users.email, 'user2@example.com'))
        const userId = user.id

        const notificationId = uuidv7()
        await context.database.insert(notifications).values({
            id: notificationId,
            userId,
            type: 'system',
            data: { type: 'system', message: 'Welcome!', level: 'info' },
            createdAt: new Date().toISOString(),
        })

        
        await authenticatedRequest(context.app, cookie)
            .post(`/api/v1/notifications/${notificationId}/read`)
            .expect(204)

        
        const [notification] = await context.database
            .select()
            .from(notifications)
            .where(eq(notifications.id, notificationId))

        expect(notification.readAt).not.toBeNull()
    })
})
