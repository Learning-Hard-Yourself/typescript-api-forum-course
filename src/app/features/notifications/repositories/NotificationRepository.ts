import type { Notification, NotificationPayload } from '@/app/features/notifications/models/NotificationTypes'

export interface NotificationCreationData {
    userId: string
    type: string
    data: NotificationPayload
}

/**
 * Repository interface for Notification entity
 */
export interface NotificationRepository {
    findById(id: string): Promise<Notification | null>
    findByUserId(userId: string): Promise<Notification[]>
    save(notification: NotificationCreationData): Promise<Notification>
    markAsRead(id: string): Promise<void>
    delete(id: string): Promise<void>
}
