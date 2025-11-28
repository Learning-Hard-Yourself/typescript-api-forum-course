import type { NextFunction, Request, Response } from 'express'

import type { PostReplyRequest } from '@/app/features/posts/requests/PostReplyRequest'
import type { PostResource } from '@/app/features/posts/resources/PostResource'
import type { PostReplier } from '@/app/features/posts/use-cases/PostReplier'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for replying to a post.
 * POST /api/v1/posts/:id/reply
 */
export class ReplyPostController {
    public constructor(
        private readonly replyRequest: PostReplyRequest,
        private readonly postResource: PostResource,
        private readonly postReplier: PostReplier,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const parentId = request.params.id

            if (!parentId) {
                response.status(400).json({ message: 'Parent post ID is required' })
                return
            }

            const payload = this.replyRequest.validate(request.body)
            const post = await this.postReplier.execute({
                authorId: userId,
                parentPostId: parentId,
                content: payload.content,
            })
            const data = this.postResource.toResponse(post)

            this.logger?.info('Reply created', { postId: post.id, parentId, userId })
            response.status(201).json({ data })
        } catch (error) {
            if (error instanceof ValidationError) {
                this.logger?.warn('Validation failed on reply creation', { errors: error.details })
            } else {
                this.logger?.error(error as Error)
            }
            next(error)
        }
    }
}
