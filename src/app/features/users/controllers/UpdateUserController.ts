import type { NextFunction, Request, Response } from 'express'

import type { UserUpdateRequest } from '@/app/features/users/requests/UserUpdateRequest'
import type { UserResource } from '@/app/features/users/resources/UserResource'
import type { UserUpdater } from '@/app/features/users/services/UserUpdater'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for updating a user profile.
 * PATCH /api/v1/users/:id
 */
export class UpdateUserController {
    public constructor(
        private readonly updateRequest: UserUpdateRequest,
        private readonly userResource: UserResource,
        private readonly userUpdater: UserUpdater,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.params.id
            if (!userId) {
                response.status(400).json({ message: 'User ID is required' })
                return
            }

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
}
