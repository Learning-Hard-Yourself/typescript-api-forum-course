import type { NextFunction, Request, Response } from 'express'

import type { PostDeleter } from '@/app/features/posts/use-cases/PostDeleter'
import type { Logger } from '@/app/shared/logging/Logger'

export class DeletePostController {
    public constructor(
        private readonly postDeleter: PostDeleter,
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

            await this.postDeleter.execute({
                postId,
                deleterId: userId,
            })
            this.logger?.info('Post deleted', { postId, userId })
            response.status(204).send()
        } catch (error) {
            console.log('Error to delete post', error)
            next(error)
        }
    }
}
