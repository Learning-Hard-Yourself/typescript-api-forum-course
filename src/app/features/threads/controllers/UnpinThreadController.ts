import type { NextFunction, Request, Response } from 'express'

import type { UserRole } from '@/app/features/threads/models/ThreadUpdate'
import type { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import type { ThreadService } from '@/app/features/threads/services/ThreadService'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for unpinning a thread.
 * POST /api/v1/threads/:id/unpin
 */
export class UnpinThreadController {
    public constructor(
        private readonly threadResource: ThreadResource,
        private readonly threadService: ThreadService,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole = (request.user!.role ?? 'user') as UserRole
            const { id } = request.params

            if (!id) {
                throw new Error('Thread ID is required')
            }

            const thread = await this.threadService.unpinThread(id, userRole)
            const data = this.threadResource.toResponse(thread)

            this.logger?.info('Thread unpinned', { threadId: id })
            response.json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
