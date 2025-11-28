import type { NextFunction, Request, Response } from 'express'

import { NotificationFormatter } from '@/app/features/notifications/use-cases/NotificationFormatter'
import type { NotificationLister } from '@/app/features/notifications/use-cases/NotificationLister'
import type { NotificationMarker } from '@/app/features/notifications/use-cases/NotificationMarker'
import type { Logger } from '@/app/shared/logging/Logger'

export class NotificationsController {
    private readonly formatter = new NotificationFormatter()

    public constructor(
        private readonly notificationLister: NotificationLister,
        private readonly notificationMarker: NotificationMarker,
        private readonly logger?: Logger,
    ) {}

    public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.id

            const notifications = await this.notificationLister.execute({ userId })

            const data = notifications.map((n) => ({
                ...n,
                formattedMessage: this.formatter.execute(n.data),
            }))

            this.logger?.info('Notifications retrieved', { userId, count: notifications.length })
            res.json({ data })
        } catch (error) {
            next(error)
        }
    }

    public async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params
            const userId = req.user!.id

            if (!id) throw new Error('Notification ID required')

            await this.notificationMarker.execute({ notificationId: id, userId })

            this.logger?.info('Notification marked as read', { notificationId: id })
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }
}
