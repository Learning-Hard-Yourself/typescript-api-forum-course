import type { Express } from 'express'

import { UsersController } from '@/app/features/users/controllers/UsersController'
import { UserUpdateRequest } from '@/app/features/users/requests/UserUpdateRequest'
import { UserResource } from '@/app/features/users/resources/UserResource'
import { UserUpdater } from '@/app/features/users/services/UserUpdater'
import type { ApplicationDependencies } from '@/routes/types'

import { UserStatsService } from '@/app/features/users/services/UserStatsService'

export class UserRoutes {
  private readonly controller: UsersController

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
  }

  public map(server: Express): void {
    server.patch('/api/users/:id', (request, response, next) => this.controller.update(request, response, next))
    server.get('/api/users/:id/stats', (request, response, next) => this.controller.getStats(request, response, next))
  }
}
