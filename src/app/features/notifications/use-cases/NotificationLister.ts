import { desc, eq } from 'drizzle-orm'

import type { Notification } from '@/app/features/notifications/models/NotificationTypes'
import type { ForumDatabase } from '@/config/database-types'
import { notifications } from '@/config/schema'

export interface NotificationListerInput {
    userId: string
}

export class NotificationLister {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: NotificationListerInput): Promise<Notification[]> {
        const results = await this.database
            .select()
            .from(notifications)
            .where(eq(notifications.userId, input.userId))
            .orderBy(desc(notifications.createdAt))

        return results as unknown as Notification[]
    }
}
