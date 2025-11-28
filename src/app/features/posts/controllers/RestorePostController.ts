import type { NextFunction, Request, Response } from 'express'

import type { PostResource } from '@/app/features/posts/resources/PostResource'
import type { PostRestorer } from '@/app/features/posts/use-cases/PostRestorer'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for restoring a deleted post.
 * POST /api/v1/posts/:id/restore
 */
export class RestorePostController {
    public constructor(
        private readonly postResource: PostResource,
        private readonly postRestorer: PostRestorer,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const postId = request.params.id

            if (!postId) {
                response.status(400).json({ message: 'Post ID is required' })
                return
            }

            const post = await this.postRestorer.execute({ postId, restorerId: userId })
            this.logger?.info('Post restored', { postId, userId })
            response.status(200).json({ data: this.postResource.toResponse(post) })
        } catch (error) {
            next(error)
        }
    }
}
