import type { NextFunction, Request, Response } from 'express'

import { ValidationError } from '@/app/Errors/ValidationError'
import type { PostCreationRequest } from '@/app/Http/Requests/PostCreationRequest'
import type { PostResource } from '@/app/Http/Resources/PostResource'
import type { Logger } from '@/app/Logging/Logger'
import type { PostService } from '@/app/Services/PostService'

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
