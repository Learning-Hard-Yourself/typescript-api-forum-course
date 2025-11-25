import { desc, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type {
    Notification,
    NotificationPayload,
    NotificationType,
    PayloadByType,
} from '@/app/features/notifications/models/NotificationTypes'
import type { ForumDatabase } from '@/config/database-types'
import { notifications } from '@/config/schema'

export class NotificationService {
    constructor(private readonly database: ForumDatabase) { }

    /**
     * Send a type-safe notification
     *
     * Learning: Generic constraint T extends NotificationType ensures
     * that the payload matches the type!
     */
    async send<T extends NotificationType>(
        userId: string,
        type: T,
        payload: Omit<PayloadByType<T>, 'type'>,
    ): Promise<Notification> {
        // Reconstruct full payload with type
        const fullPayload = { type, ...payload } as unknown as NotificationPayload

        const id = uuidv7()
        const [notification] = await this.database
            .insert(notifications)
            .values({
                id,
                userId,
                type,
                data: fullPayload,
                createdAt: new Date().toISOString(),
            })
            .returning()

        if (!notification) {
            throw new Error('Failed to create notification')
        }

        return notification as unknown as Notification
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId: string): Promise<Notification[]> {
        const results = await this.database
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))

        return results as unknown as Notification[]
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        await this.database
            .update(notifications)
            .set({ readAt: new Date().toISOString() })
            .where(eq(notifications.id, notificationId))
    }

    /**
     * Format notification message using exhaustiveness checking
     */
    formatMessage(notification: NotificationPayload): string {
        switch (notification.type) {
            case 'reply':
                return `New reply to your post in thread ${notification.threadId}`
            case 'vote':
                return `New ${notification.voteType} on your post`
            case 'system':
                return `System Alert: ${notification.message}`
            default:
                // Exhaustiveness check: TypeScript will error if we forget a case!
                const _exhaustive: never = notification
                return 'Unknown notification'
        }
    }
}
