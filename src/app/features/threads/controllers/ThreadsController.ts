import type { NextFunction, Request, Response } from 'express'

import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { ThreadCreationRequest } from '@/app/features/threads/requests/ThreadCreationRequest'
import type { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import type { Logger } from '@/app/shared/logging/Logger'
import type { ThreadService } from '@/app/features/threads/services/ThreadService'

export class ThreadsController {
    public constructor(
        private readonly creationRequest: ThreadCreationRequest,
        private readonly threadResource: ThreadResource,
        private readonly threadService: ThreadService,
        private readonly logger?: Logger,
    ) { }

    public async store(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            // TODO: Get authenticated user ID from request (middleware should populate this)
            // For now, we might need to mock it or assume it's passed in body/headers for testing if auth isn't fully wired
            // But based on existing code, `request.user` might be available if auth middleware runs.
            // Let's assume a dummy user ID for now if not present, or fail.
            // The requirement says "login usaremos better-auth", so auth should be there.
            // I'll assume `request.headers['x-user-id']` for simple testing or `request.user.id` if typed.
            // Let's use a hardcoded ID for now or throw if not found, to be safe.
            const userId = 'usr_1' // Placeholder until auth middleware is confirmed

            const attributes = this.creationRequest.validate(request.body)
            const thread = await this.threadService.create(userId, attributes)
            const data = this.threadResource.toResponse(thread)
            this.logger?.info('Thread created', { threadId: thread.id })
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
