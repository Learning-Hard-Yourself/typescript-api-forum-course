import type { NextFunction, Request, Response } from 'express'

import type { PostCreationRequest } from '@/app/features/posts/requests/PostCreationRequest'
import type { PostResource } from '@/app/features/posts/resources/PostResource'
import type { PostService } from '@/app/features/posts/services/PostService'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for creating a new post.
 * POST /api/v1/posts
 */
export class StorePostController {
    public constructor(
        private readonly creationRequest: PostCreationRequest,
        private readonly postResource: PostResource,
        private readonly postService: PostService,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const payload = this.creationRequest.validate(request.body)
            const post = await this.postService.createPost(userId, payload)
            const data = this.postResource.toResponse(post)
            this.logger?.info('Post created', { postId: post.id, userId })
            response.status(201).json({ data })
        } catch (error) {
            next(error)
        }
    }
}
