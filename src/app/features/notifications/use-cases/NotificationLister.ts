import type { Notification } from '@/app/features/notifications/models/NotificationTypes'
import type { NotificationRepository } from '../repositories/NotificationRepository'

export interface NotificationListerInput {
    userId: string
}

export class NotificationLister {
    public constructor(private readonly notificationRepository: NotificationRepository) {}

    public async execute(input: NotificationListerInput): Promise<Notification[]> {
        return this.notificationRepository.findByUserId(input.userId)
    }
}
