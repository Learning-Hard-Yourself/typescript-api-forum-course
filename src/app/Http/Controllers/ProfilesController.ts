import type { NextFunction, Request, Response } from 'express'

import { NotFoundError } from '@/app/Errors/NotFoundError'
import { ValidationError } from '@/app/Errors/ValidationError'
import type { ProfileUpdateRequest } from '@/app/Http/Requests/ProfileUpdateRequest'
import type { ProfileResource } from '@/app/Http/Resources/ProfileResource'
import type { Logger } from '@/app/Logging/Logger'
import type { ProfileService } from '@/app/Services/ProfileService'

export class ProfilesController {
    public constructor(
        private readonly updateRequest: ProfileUpdateRequest,
        private readonly profileResource: ProfileResource,
        private readonly profileService: ProfileService,
        private readonly logger?: Logger,
    ) { }

    public async show(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.params.userId
            if (!userId) {
                throw new Error('User ID is required')
            }
            const profile = await this.profileService.getByUserId(userId)
            const data = this.profileResource.toResponse(profile)
            response.status(200).json({ data })
        } catch (error) {
            if (error instanceof NotFoundError) {
                this.logger?.warn('Profile not found', { userId: request.params.userId })
            } else {
                this.logger?.error(error as Error)
            }
            next(error)
        }
    }

    public async update(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.params.userId
            if (!userId) {
                throw new Error('User ID is required')
            }
            // TODO: Ensure authenticated user matches userId or is admin
            const attributes = this.updateRequest.validate(request.body)
            const profile = await this.profileService.update(userId, attributes)
            const data = this.profileResource.toResponse(profile)
            this.logger?.info('Profile updated', { userId })
            response.status(200).json({ data })
        } catch (error) {
            if (error instanceof ValidationError) {
                this.logger?.warn('Validation failed on profile update', { errors: error.details })
            } else {
                this.logger?.error(error as Error)
            }
            next(error)
        }
    }
}
