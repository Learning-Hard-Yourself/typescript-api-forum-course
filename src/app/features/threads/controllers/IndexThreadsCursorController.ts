import type { NextFunction, Request, Response } from 'express'

import { ThreadCursorListRequestSchema } from '@/app/features/threads/requests/ThreadCursorListRequest'
import type { ThreadCursorLister } from '@/app/features/threads/use-cases/ThreadCursorLister'
import { CachePresets, headers } from '@/app/shared/http/ResponseHeaders'
import type { Logger } from '@/app/shared/logging/Logger'

export class IndexThreadsCursorController {
    public constructor(
        private readonly threadCursorLister: ThreadCursorLister,
        private readonly logger?: Logger,
    ) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const params = ThreadCursorListRequestSchema.parse(req.query)
            const result = await this.threadCursorLister.execute(params)

            this.logger?.info('Threads listed (cursor)', {
                after: params.after,
                before: params.before,
                first: params.first,
                count: result.edges.length,
                hasNextPage: result.pageInfo.hasNextPage,
            })

            headers(res).cache(CachePresets.noCache)

            res.json(result)
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
