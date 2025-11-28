import type { Express } from 'express'

import { StatsUserController } from '@/app/features/users/controllers/StatsUserController'
import { UpdateUserController } from '@/app/features/users/controllers/UpdateUserController'
import { UserUpdateRequest } from '@/app/features/users/requests/UserUpdateRequest'
import { UserResource } from '@/app/features/users/resources/UserResource'
import { UserStatsService } from '@/app/features/users/services/UserStatsService'
import { UserUpdater } from '@/app/features/users/services/UserUpdater'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { createRequireOwnership } from '@/app/shared/http/middleware/RequireOwnershipMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class UserRoutes {
    private readonly updateController: UpdateUserController
    private readonly statsController: StatsUserController
    private readonly requireOwnership: ReturnType<typeof createRequireOwnership>

    public constructor(dependencies: ApplicationDependencies) {
        const userUpdater = new UserUpdater(dependencies.database)
        const userStatsService = new UserStatsService(dependencies.database)
        const logger = dependencies.logger?.child({ context: 'Users' })

        this.updateController = new UpdateUserController(new UserUpdateRequest(), new UserResource(), userUpdater, logger)
        this.statsController = new StatsUserController(userStatsService, logger)
        this.requireOwnership = createRequireOwnership(dependencies.database)
    }

    public map(server: Express): void {
        server.patch('/api/v1/users/:id', authMiddleware, this.requireOwnership('user'), (req, res, next) => this.updateController.handle(req, res, next))
        server.get('/api/v1/users/:id/stats', (req, res, next) => this.statsController.handle(req, res, next))
    }
}
