import type { NextFunction, Request, Response } from 'express'

import type { UserUpdateRequest } from '@/app/features/users/requests/UserUpdateRequest'
import type { UserResource } from '@/app/features/users/resources/UserResource'
import type { UserUpdater } from '@/app/features/users/services/UserUpdater'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { Logger } from '@/app/shared/logging/Logger'

import type { UserStatsService } from '@/app/features/users/services/UserStatsService'

export class UsersController {
  public constructor(
    private readonly updateRequest: UserUpdateRequest,
    private readonly userResource: UserResource,
    private readonly userUpdater: UserUpdater,
    private readonly userStatsService: UserStatsService,
    private readonly logger?: Logger,
  ) { }

  public async update(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.params.id
      if (!userId) throw new Error('User ID required')

      const attributes = this.updateRequest.validate(request.body)
      const user = await this.userUpdater.execute({ id: userId, attributes })
      const data = this.userResource.toResponse(user)
      this.logger?.info('User updated', { userId: user.id })
      response.status(200).json({ data })
    } catch (error) {
      if (error instanceof ValidationError) {
        this.logger?.warn('Validation failed on user update', { errors: error.details })
      } else if (error instanceof NotFoundError) {
        this.logger?.warn('Attempted to update missing user', { userId: request.params.id })
      } else {
        this.logger?.error(error as Error)
      }
      next(error)
    }
  }

  public async getStats(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.params.id
      if (!userId) throw new Error('User ID required')

      const stats = await this.userStatsService.getUserStats(userId)

      this.logger?.info('User stats retrieved', { userId })
      response.status(200).json({ data: stats })
    } catch (error) {
      next(error)
    }
  }
}
