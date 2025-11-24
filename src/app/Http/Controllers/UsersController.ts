import type { NextFunction, Request, Response } from 'express'

import { NotFoundError } from '@/app/Errors/NotFoundError'
import { ValidationError } from '@/app/Errors/ValidationError'
import type { UserUpdateRequest } from '@/app/Http/Requests/UserUpdateRequest'
import type { UserResource } from '@/app/Http/Resources/UserResource'
import type { Logger } from '@/app/Logging/Logger'
import type { UserUpdater } from '@/app/Services/UserUpdater'

export class UsersController {
  public constructor(
    private readonly updateRequest: UserUpdateRequest,
    private readonly userResource: UserResource,
    private readonly userUpdater: UserUpdater,
    private readonly logger?: Logger,
  ) { }

  public async update(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.params.id
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
        this.logger?.error(error)
      }
      next(error)
    }
  }
}
