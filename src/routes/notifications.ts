import type { Express } from 'express'

import { NotificationsController } from '@/app/features/notifications/controllers/NotificationsController'
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
        server.get('/api/notifications', (req, res, next) => this.controller.list(req, res, next))
        server.post('/api/notifications/:id/read', (req, res, next) =>
            this.controller.markAsRead(req, res, next),
        )
    }
}
