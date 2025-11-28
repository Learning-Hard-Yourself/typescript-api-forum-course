import type { NextFunction, Request, Response } from 'express'

import type { ThreadCreationRequest } from '@/app/features/threads/requests/ThreadCreationRequest'
import type { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import type { ThreadCreator } from '@/app/features/threads/use-cases/ThreadCreator'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import { headers } from '@/app/shared/http/ResponseHeaders'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for creating a new thread.
 * POST /api/v1/threads
 */
export class StoreThreadController {
    public constructor(
        private readonly creationRequest: ThreadCreationRequest,
        private readonly threadResource: ThreadResource,
        private readonly threadCreator: ThreadCreator,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const attributes = this.creationRequest.validate(request.body)
            const thread = await this.threadCreator.execute({ authorId: userId, attributes })
            const data = this.threadResource.toResponse(thread)
            this.logger?.info('Thread created', { threadId: thread.id, userId })

            headers(response)
                .location({ basePath: '/api/v1/threads', resourceId: thread.id })

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
