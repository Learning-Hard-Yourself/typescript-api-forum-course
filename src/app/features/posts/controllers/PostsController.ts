import type { NextFunction, Request, Response } from 'express'

import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { PostCreationRequest } from '@/app/features/posts/requests/PostCreationRequest'
import type { PostResource } from '@/app/features/posts/resources/PostResource'
import type { Logger } from '@/app/shared/logging/Logger'
import type { PostService } from '@/app/features/posts/services/PostService'

export class PostsController {
    public constructor(
        private readonly creationRequest: PostCreationRequest,
        private readonly postResource: PostResource,
        private readonly postService: PostService,
        private readonly logger?: Logger,
    ) { }

    public async store(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            // TODO: Get authenticated user ID
            const userId = 'usr_1' // Placeholder

            const attributes = this.creationRequest.validate(request.body)
            const post = await this.postService.create(userId, attributes)
            const data = this.postResource.toResponse(post)
            this.logger?.info('Post created', { postId: post.id })
            response.status(201).json({ data })
        } catch (error) {
            if (error instanceof ValidationError) {
                this.logger?.warn('Validation failed on post creation', { errors: error.details })
            } else {
                this.logger?.error(error as Error)
            }
            next(error)
        }
    }
}
