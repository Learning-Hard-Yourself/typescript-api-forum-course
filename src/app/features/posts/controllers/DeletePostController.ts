import type { NextFunction, Request, Response } from 'express'

import type { PostDeleteRequest } from '@/app/features/posts/requests/PostDeleteRequest'
import type { PostModerationService } from '@/app/features/posts/services/PostModerationService'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for deleting a post (soft delete).
 * DELETE /api/v1/posts/:id
 */
export class DeletePostController {
    public constructor(
        private readonly deleteRequest: PostDeleteRequest,
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

            const payload = this.deleteRequest.validate(request.body)
            await this.moderationService.deletePost(postId, userId, payload.reason)
            this.logger?.info('Post deleted', { postId, userId })
            response.status(204).send()
        } catch (error) {
            next(error)
        }
    }
}
