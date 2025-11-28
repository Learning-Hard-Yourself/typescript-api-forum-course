import type { NextFunction, Request, Response } from 'express'

import type { PostModerationService } from '@/app/features/posts/services/PostModerationService'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for restoring a deleted post.
 * POST /api/v1/posts/:id/restore
 */
export class RestorePostController {
    public constructor(
        private readonly moderationService: PostModerationService,
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

            await this.moderationService.restorePost(postId, userId)
            this.logger?.info('Post restored', { postId, userId })
            response.status(200).json({ data: await this.moderationService.getPostWithHistory(postId) })
        } catch (error) {
            next(error)
        }
    }
}
