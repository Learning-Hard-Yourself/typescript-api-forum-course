import type { NextFunction, Request, Response } from 'express'

import type { UserRole } from '@/app/features/threads/models/ThreadUpdate'
import { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import type { ThreadPinner } from '@/app/features/threads/use-cases/ThreadPinner'
import type { Logger } from '@/app/shared/logging/Logger'

export class PinThreadController {
    public constructor(
        private readonly threadPinner: ThreadPinner,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole = (request.user!.role ?? 'user') as UserRole
            const { id } = request.params

            if (!id) {
                throw new Error('Thread ID is required')
            }

            const thread = await this.threadPinner.execute({ threadId: id, userRole, pin: true })

            this.logger?.info('Thread pinned', { threadId: id })
            response.json(new ThreadResource(thread).toResponse())
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
