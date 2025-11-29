import type { Express } from 'express'

import { StatsUserController } from '@/app/features/users/controllers/StatsUserController'
import { UpdateUserController } from '@/app/features/users/controllers/UpdateUserController'
import { DrizzleUserRepository } from '@/app/features/users/repositories/DrizzleUserRepository'
import { UserUpdateRequest } from '@/app/features/users/requests/UserUpdateRequest'
import { UserStatsRetriever } from '@/app/features/users/use-cases/UserStatsRetriever'
import { UserUpdater } from '@/app/features/users/use-cases/UserUpdater'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { createRequireOwnership } from '@/app/shared/http/middleware/RequireOwnershipMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class UserRoutes {
    private readonly updateController: UpdateUserController
    private readonly statsController: StatsUserController
    private readonly requireOwnership: ReturnType<typeof createRequireOwnership>

    public constructor(dependencies: ApplicationDependencies) {
        const logger = dependencies.logger?.child({ context: 'Users' })

        const userRepository = new DrizzleUserRepository(dependencies.database)

        const userUpdater = new UserUpdater(userRepository)
        const userStatsRetriever = new UserStatsRetriever(userRepository)

        this.updateController = new UpdateUserController(new UserUpdateRequest(), userUpdater, logger)
        this.statsController = new StatsUserController(userStatsRetriever, logger)
        this.requireOwnership = createRequireOwnership(dependencies.database)
    }

    public map(server: Express): void {
        server.patch('/api/v1/users/:id', authMiddleware, this.requireOwnership('user'), (req, res, next) => this.updateController.handle(req, res, next))
        server.get('/api/v1/users/:id/stats', (req, res, next) => this.statsController.handle(req, res, next))
    }
}
