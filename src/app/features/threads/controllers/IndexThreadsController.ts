import type { NextFunction, Request, Response } from 'express'

import { ThreadListRequestSchema } from '@/app/features/threads/requests/ThreadListRequest'
import type { ThreadService } from '@/app/features/threads/services/ThreadService'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for listing threads.
 * GET /api/v1/threads
 */
export class IndexThreadsController {
    public constructor(
        private readonly threadService: ThreadService,
        private readonly logger?: Logger,
    ) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const params = ThreadListRequestSchema.parse(req.query)
            const result = await this.threadService.list(params)

            this.logger?.info('Threads listed', {
                page: params.page,
                perPage: params.perPage,
                total: result.meta.total,
            })
            res.json(result)
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
