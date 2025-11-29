import { desc, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { Notification } from '@/app/features/notifications/models/NotificationTypes'
import type { ForumDatabase } from '@/config/database-types'
import { notifications } from '@/config/schema'
import type { NotificationCreationData, NotificationRepository } from './NotificationRepository'

/**
 * Drizzle ORM implementation of NotificationRepository
 */
export class DrizzleNotificationRepository implements NotificationRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findById(id: string): Promise<Notification | null> {
        const [notification] = await this.database
            .select()
            .from(notifications)
            .where(eq(notifications.id, id))
            .limit(1)

        return (notification as unknown as Notification) ?? null
    }

    async findByUserId(userId: string): Promise<Notification[]> {
        const results = await this.database
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))

        return results as unknown as Notification[]
    }

    async save(data: NotificationCreationData): Promise<Notification> {
        const [notification] = await this.database
            .insert(notifications)
            .values({
                id: uuidv7(),
                userId: data.userId,
                type: data.type,
                data: data.data,
                createdAt: new Date().toISOString(),
            })
            .returning()

        if (!notification) {
            throw new Error('Failed to create notification')
        }

        return notification as unknown as Notification
    }

    async markAsRead(id: string): Promise<void> {
        await this.database
            .update(notifications)
            .set({ readAt: new Date().toISOString() })
            .where(eq(notifications.id, id))
    }

    async delete(id: string): Promise<void> {
        await this.database.delete(notifications).where(eq(notifications.id, id))
    }
}
