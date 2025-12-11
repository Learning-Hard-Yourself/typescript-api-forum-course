import type { NextFunction, Request, Response } from 'express'

import type { UserRole } from '@/app/features/threads/models/ThreadUpdate'
import type { ThreadDeleter } from '@/app/features/threads/use-cases/ThreadDeleter'
import type { Logger } from '@/app/shared/logging/Logger'

export class DeleteThreadController {
    public constructor(
        private readonly threadDeleter: ThreadDeleter,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole = (request.user!.role ?? 'user') as UserRole
            const { id } = request.params

            if (!id) {
                response.status(400).json({ message: 'Thread ID is required' })
                return
            }

            await this.threadDeleter.execute({ threadId: id, userRole })

            this.logger?.info('Thread deleted', { threadId: id })
            response.status(204).send()
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
