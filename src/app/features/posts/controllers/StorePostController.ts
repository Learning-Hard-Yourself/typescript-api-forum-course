import type { NextFunction, Request, Response } from 'express'

import type { PostCreationRequest } from '@/app/features/posts/requests/PostCreationRequest'
import type { PostResource } from '@/app/features/posts/resources/PostResource'
import type { PostCreator } from '@/app/features/posts/use-cases/PostCreator'
import { headers } from '@/app/shared/http/ResponseHeaders'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for creating a new post.
 * POST /api/v1/posts
 */
export class StorePostController {
    public constructor(
        private readonly creationRequest: PostCreationRequest,
        private readonly postResource: PostResource,
        private readonly postCreator: PostCreator,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const payload = this.creationRequest.validate(request.body)
            const post = await this.postCreator.execute({ authorId: userId, attributes: payload })
            const data = this.postResource.toResponse(post)
            this.logger?.info('Post created', { postId: post.id, userId })

            headers(response)
                .location({ basePath: '/api/v1/posts', resourceId: post.id })

            response.status(201).json({ data })
        } catch (error) {
            next(error)
        }
    }
}
