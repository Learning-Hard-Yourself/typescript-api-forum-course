import type { Express } from 'express'

import { NotificationsController } from '@/app/features/notifications/controllers/NotificationsController'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class NotificationRoutes {
    private readonly controller: NotificationsController

    public constructor(dependencies: ApplicationDependencies) {
        this.controller = new NotificationsController(
            dependencies.database,
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
