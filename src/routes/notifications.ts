import type { Express } from 'express'

import { NotificationsController } from '@/app/features/notifications/controllers/NotificationsController'
import { DrizzleNotificationRepository } from '@/app/features/notifications/repositories/DrizzleNotificationRepository'
import { NotificationLister } from '@/app/features/notifications/use-cases/NotificationLister'
import { NotificationMarker } from '@/app/features/notifications/use-cases/NotificationMarker'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class NotificationRoutes {
    private readonly controller: NotificationsController

    public constructor(dependencies: ApplicationDependencies) {
        const notificationRepository = new DrizzleNotificationRepository(dependencies.database)

        const notificationLister = new NotificationLister(notificationRepository)
        const notificationMarker = new NotificationMarker(notificationRepository)

        this.controller = new NotificationsController(
            notificationLister,
            notificationMarker,
            dependencies.logger?.child({ context: 'NotificationsController' }),
        )
    }

    public map(server: Express): void {
        server.get('/api/v1/notifications', authMiddleware, (request, response, next) => this.controller.list(request, response, next))
        server.post('/api/v1/notifications/:id/read', authMiddleware, (request, response, next) =>
            this.controller.markAsRead(request, response, next),
        )
    }
}
