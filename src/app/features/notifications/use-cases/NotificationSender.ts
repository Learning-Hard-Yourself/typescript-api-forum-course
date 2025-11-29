import type {
    Notification,
    NotificationPayload,
    NotificationType,
    PayloadByType,
} from '@/app/features/notifications/models/NotificationTypes'
import type { NotificationRepository } from '../repositories/NotificationRepository'

export interface NotificationSenderInput<T extends NotificationType> {
    userId: string
    type: T
    payload: Omit<PayloadByType<T>, 'type'>
}

export class NotificationSender {
    public constructor(private readonly notificationRepository: NotificationRepository) {}

    public async execute<T extends NotificationType>(
        input: NotificationSenderInput<T>,
    ): Promise<Notification> {
        const { userId, type, payload } = input
        const fullPayload = { type, ...payload } as unknown as NotificationPayload

        return this.notificationRepository.save({
            userId,
            type,
            data: fullPayload,
        })
    }
}
