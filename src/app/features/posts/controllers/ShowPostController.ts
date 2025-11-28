import type { NextFunction, Request, Response } from 'express'

import { PostResource } from '@/app/features/posts/resources/PostResource'
import type { PostFinder } from '@/app/features/posts/use-cases/PostFinder'
import { CachePresets, headers } from '@/app/shared/http/ResponseHeaders'
import type { Logger } from '@/app/shared/logging/Logger'

export class ShowPostController {
    public constructor(
        private readonly postFinder: PostFinder,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = request.params
            if (!id) {
                response.status(400).json({ message: 'Post ID is required' })
                return
            }

            const post = await this.postFinder.execute({ id })
            const resource = new PostResource(post)

            headers(response)
                .cache(CachePresets.privateShort)
                .etag({ data: resource.toArray() })

            response.status(200).json(resource.toResponse())
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
