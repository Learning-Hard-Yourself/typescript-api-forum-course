import { v7 as uuidv7 } from 'uuid'

import type {
    Notification,
    NotificationPayload,
    NotificationType,
    PayloadByType,
} from '@/app/features/notifications/models/NotificationTypes'
import type { ForumDatabase } from '@/config/database-types'
import { notifications } from '@/config/schema'

export interface NotificationSenderInput<T extends NotificationType> {
    userId: string
    type: T
    payload: Omit<PayloadByType<T>, 'type'>
}

export class NotificationSender {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute<T extends NotificationType>(
        input: NotificationSenderInput<T>,
    ): Promise<Notification> {
        const { userId, type, payload } = input
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
}
