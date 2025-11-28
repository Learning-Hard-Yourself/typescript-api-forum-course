import type { NextFunction, Request, Response } from 'express'

import type { UserUpdateRequest } from '@/app/features/users/requests/UserUpdateRequest'
import { UserResource } from '@/app/features/users/resources/UserResource'
import type { UserUpdater } from '@/app/features/users/use-cases/UserUpdater'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { Logger } from '@/app/shared/logging/Logger'

export class UpdateUserController {
    public constructor(
        private readonly updateRequest: UserUpdateRequest,
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
            this.logger?.info('User updated', { userId: user.id })
            response.status(200).json(new UserResource(user).toResponse())
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
