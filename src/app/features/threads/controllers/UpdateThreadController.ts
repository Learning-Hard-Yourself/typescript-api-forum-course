import type { NextFunction, Request, Response } from 'express'

import type { UserRole } from '@/app/features/threads/models/ThreadUpdate'
import { ThreadUpdateRequestSchema } from '@/app/features/threads/requests/ThreadUpdateRequest'
import type { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import type { ThreadUpdater } from '@/app/features/threads/use-cases/ThreadUpdater'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for updating a thread.
 * PATCH /api/v1/threads/:id
 */
export class UpdateThreadController {
    public constructor(
        private readonly threadResource: ThreadResource,
        private readonly threadUpdater: ThreadUpdater,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const userRole = (request.user!.role ?? 'user') as UserRole
            const { id } = request.params

            if (!id) {
                throw new Error('Thread ID is required')
            }

            const validatedData = ThreadUpdateRequestSchema.parse(request.body)
            const thread = await this.threadUpdater.execute({
                threadId: id,
                userId,
                userRole,
                updateData: validatedData,
            })
            const data = this.threadResource.toResponse(thread)

            this.logger?.info('Thread updated', { threadId: id, userId })
            response.status(200).json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
