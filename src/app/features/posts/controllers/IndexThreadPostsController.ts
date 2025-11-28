import type { NextFunction, Request, Response } from 'express'

import { NestedPostResource } from '@/app/features/posts/resources/NestedPostResource'
import type { ThreadPostsLister } from '@/app/features/posts/use-cases/ThreadPostsLister'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for listing posts in a thread.
 * GET /api/v1/threads/:threadId/posts
 */
export class IndexThreadPostsController {
    public constructor(
        private readonly threadPostsLister: ThreadPostsLister,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const threadId = request.params.threadId as string

            if (!threadId) {
                response.status(400).json({ message: 'Thread ID is required' })
                return
            }

            const posts = await this.threadPostsLister.execute({ threadId })
            const nestedResource = new NestedPostResource()
            const data = nestedResource.toJsonArray(posts)

            this.logger?.info('Thread posts retrieved', { threadId, count: posts.length })
            response.status(200).json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
