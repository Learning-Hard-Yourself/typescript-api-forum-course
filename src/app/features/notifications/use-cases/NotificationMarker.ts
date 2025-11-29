import type { NotificationRepository } from '../repositories/NotificationRepository'

export interface NotificationMarkerInput {
    notificationId: string
    userId: string
}

export class NotificationMarker {
    public constructor(private readonly notificationRepository: NotificationRepository) {}

    public async execute(input: NotificationMarkerInput): Promise<void> {
        await this.notificationRepository.markAsRead(input.notificationId)
    }
}
