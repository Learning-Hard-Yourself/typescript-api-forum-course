import type { NextFunction, Request, Response } from 'express'

import { PostResource } from '@/app/features/posts/resources/PostResource'
import type { PostRestorer } from '@/app/features/posts/use-cases/PostRestorer'
import type { Logger } from '@/app/shared/logging/Logger'

export class RestorePostController {
    public constructor(
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
            response.status(200).json(new PostResource(post).toResponse())
        } catch (error) {
            next(error)
        }
    }
}
