import { eq } from 'drizzle-orm'

import type { ForumDatabase } from '@/config/database-types'
import { notifications } from '@/config/schema'

export interface NotificationMarkerInput {
    notificationId: string
    userId: string
}

/**
 * Use case for marking a notification as read.
 */
export class NotificationMarker {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: NotificationMarkerInput): Promise<void> {
        await this.database
            .update(notifications)
            .set({ readAt: new Date().toISOString() })
            .where(eq(notifications.id, input.notificationId))
    }
}
