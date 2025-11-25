import { eq } from 'drizzle-orm'
import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { notifications, users } from '@/config/schema'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('Notifications', () => {
    it('allows retrieving user notifications', async () => {
        const context = await createTestApplication()

        // 1. Setup Data
        const userId = 'usr_1'
        await context.database.insert(users).values({
            id: userId,
            username: 'user',
            email: 'user@example.com',
            displayName: 'User',
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        })

        // 2. Create Notification directly in DB (simulating service call)
        const notificationId = uuidv7()
        await context.database.insert(notifications).values({
            id: notificationId,
            userId,
            type: 'system',
            data: { type: 'system', message: 'Welcome!', level: 'info' },
            createdAt: new Date().toISOString(),
        })

        // 3. Get Notifications
        const response = await request(context.app)
            .get('/api/notifications')
            .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].id).toBe(notificationId)
        expect(response.body.data[0].formattedMessage).toBe('System Alert: Welcome!')
    })

    it('allows marking notification as read', async () => {
        const context = await createTestApplication()

        // 1. Setup Data
        const userId = 'usr_1'
        await context.database.insert(users).values({
            id: userId,
            username: 'user',
            email: 'user@example.com',
            displayName: 'User',
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        })

        const notificationId = uuidv7()
        await context.database.insert(notifications).values({
            id: notificationId,
            userId,
            type: 'system',
            data: { type: 'system', message: 'Welcome!', level: 'info' },
            createdAt: new Date().toISOString(),
        })

        // 2. Mark as Read
        await request(context.app)
            .post(`/api/notifications/${notificationId}/read`)
            .expect(204)

        // 3. Verify DB
        const [notification] = await context.database
            .select()
            .from(notifications)
            .where(eq(notifications.id, notificationId))

        expect(notification.readAt).not.toBeNull()
    })
})
