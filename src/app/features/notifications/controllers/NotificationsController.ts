import type { NextFunction, Request, Response } from 'express'

import type { NotificationService } from '@/app/features/notifications/services/NotificationService'
import { NotificationService as Service } from '@/app/features/notifications/services/NotificationService'
import type { Logger } from '@/app/shared/logging/Logger'
import type { ForumDatabase } from '@/config/database-types'

export class NotificationsController {
    private readonly notificationService: NotificationService

    constructor(
        database: ForumDatabase,
        private readonly logger?: Logger,
    ) {
        this.notificationService = new Service(database)
    }


    public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.id

            const notifications = await this.notificationService.getUserNotifications(userId)

            const data = notifications.map((n) => ({
                ...n,
                formattedMessage: this.notificationService.formatMessage(n.data),
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

            await this.notificationService.markAsRead(id, userId)

            this.logger?.info('Notification marked as read', { notificationId: id })
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }
}
