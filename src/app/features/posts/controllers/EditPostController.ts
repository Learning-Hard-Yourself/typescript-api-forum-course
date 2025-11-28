import type { NextFunction, Request, Response } from 'express'

import type { PostEditRequest } from '@/app/features/posts/requests/PostEditRequest'
import type { PostResource } from '@/app/features/posts/resources/PostResource'
import type { PostEditor } from '@/app/features/posts/use-cases/PostEditor'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for editing a post.
 * PATCH /api/v1/posts/:id
 */
export class EditPostController {
    public constructor(
        private readonly editRequest: PostEditRequest,
        private readonly postResource: PostResource,
        private readonly postEditor: PostEditor,
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

            const payload = this.editRequest.validate(request.body)
            const post = await this.postEditor.execute({
                postId,
                editorId: userId,
                newContent: payload.content,
                reason: payload.reason,
            })
            const data = this.postResource.toResponse(post)
            this.logger?.info('Post edited', { postId, userId })
            response.status(200).json({ data })
        } catch (error) {
            next(error)
        }
    }
}
