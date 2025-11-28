import type { NextFunction, Request, Response } from 'express'

import type { ThreadCreationRequest } from '@/app/features/threads/requests/ThreadCreationRequest'
import type { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import type { ThreadService } from '@/app/features/threads/services/ThreadService'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for creating a new thread.
 * POST /api/v1/threads
 */
export class StoreThreadController {
    public constructor(
        private readonly creationRequest: ThreadCreationRequest,
        private readonly threadResource: ThreadResource,
        private readonly threadService: ThreadService,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const attributes = this.creationRequest.validate(request.body)
            const thread = await this.threadService.create(userId, attributes)
            const data = this.threadResource.toResponse(thread)
            this.logger?.info('Thread created', { threadId: thread.id, userId })
            response.status(201).json({ data })
        } catch (error) {
            if (error instanceof ValidationError) {
                this.logger?.warn('Validation failed on thread creation', { errors: error.details })
            } else {
                this.logger?.error(error as Error)
            }
            next(error)
        }
    }
}
