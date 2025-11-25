import type { Express } from 'express'

import { UsersController } from '@/app/features/users/controllers/UsersController'
import { UserUpdateRequest } from '@/app/features/users/requests/UserUpdateRequest'
import { UserResource } from '@/app/features/users/resources/UserResource'
import { UserStatsService } from '@/app/features/users/services/UserStatsService'
import { UserUpdater } from '@/app/features/users/services/UserUpdater'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { createRequireOwnership } from '@/app/shared/http/middleware/RequireOwnershipMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class UserRoutes {
  private readonly controller: UsersController
  private readonly requireOwnership: ReturnType<typeof createRequireOwnership>

  public constructor(dependencies: ApplicationDependencies) {
    const userUpdater = new UserUpdater(dependencies.database)
    const userStatsService = new UserStatsService(dependencies.database)

    this.controller = new UsersController(
      new UserUpdateRequest(),
      new UserResource(),
      userUpdater,
      userStatsService,
      dependencies.logger?.child({ context: 'UsersController' }),
    )
    this.requireOwnership = createRequireOwnership(dependencies.database)
  }

  public map(server: Express): void {
    server.patch('/api/v1/users/:id', authMiddleware, this.requireOwnership('user'), (request, response, next) => this.controller.update(request, response, next))
    server.get('/api/v1/users/:id/stats', (request, response, next) => this.controller.getStats(request, response, next))
  }
}
