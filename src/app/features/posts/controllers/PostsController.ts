import type { NextFunction, Request, Response } from 'express'

import type { PostCreationRequest } from '@/app/features/posts/requests/PostCreationRequest'
import { PostDeleteRequestSchema, PostEditRequestSchema } from '@/app/features/posts/requests/PostEditRequest'
import type { PostReplyRequest } from '@/app/features/posts/requests/PostReplyRequest'
import { NestedPostResource } from '@/app/features/posts/resources/NestedPostResource'
import type { PostResource } from '@/app/features/posts/resources/PostResource'
import { PostModerationService } from '@/app/features/posts/services/PostModerationService'
import type { PostService } from '@/app/features/posts/services/PostService'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { Logger } from '@/app/shared/logging/Logger'
import type { ForumDatabase } from '@/config/database-types'

export class PostsController {
    private readonly moderationService: PostModerationService

    public constructor(
        private readonly creationRequest: PostCreationRequest,
        private readonly replyRequest: PostReplyRequest,
        private readonly postResource: PostResource,
        private readonly postService: PostService,
        database: ForumDatabase,
        private readonly logger?: Logger,
    ) {
        this.moderationService = new PostModerationService(database)
    }

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

    /**
     * Create a reply to an existing post
     * POST /api/posts/:postId/reply
     */
    public async reply(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const parentPostId = request.params.postId as string
            // TODO: Get authenticated user ID
            const userId = 'usr_1' // Placeholder

            if (!parentPostId) {
                response.status(400).json({ message: 'Parent post ID is required' })
                return
            }

            const { content } = this.replyRequest.validate(request.body)
            const post = await this.postService.createReply(parentPostId, userId, content)
            const data = this.postResource.toResponse(post)

            this.logger?.info('Reply created', { postId: post.id, parentPostId })
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

    /**
     * Get thread posts with nested structure
     * GET /api/threads/:threadId/posts
     */
    public async getThreadPosts(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const threadId = request.params.threadId as string

            if (!threadId) {
                response.status(400).json({ message: 'Thread ID is required' })
                return
            }

            const posts = await this.postService.getThreadPosts(threadId)
            const nestedResource = new NestedPostResource()
            const data = nestedResource.toJsonArray(posts)

            this.logger?.info('Thread posts retrieved', { threadId, count: posts.length })
            response.status(200).json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    /**
     * PATCH /api/posts/:id - Edit post
     */
    public async edit(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params
            const userId = 'usr_1' // TODO: from auth

            if (!id) throw new Error('Post ID required')

            const { content, reason } = PostEditRequestSchema.parse(req.body)
            const post = await this.moderationService.editPost(id, userId, content, reason)

            this.logger?.info('Post edited', { postId: id })
            res.json({ data: this.postResource.toResponse(post) })
        } catch (error) {
            next(error)
        }
    }

    /**
     * DELETE /api/posts/:id - Soft delete post
     */
    public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params
            const userId = 'usr_1' // TODO: from auth

            if (!id) throw new Error('Post ID required')

            const { reason } = PostDeleteRequestSchema.parse(req.body)
            await this.moderationService.deletePost(id, userId, reason)

            this.logger?.info('Post deleted', { postId: id })
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/posts/:id/restore - Restore deleted post
     */
    public async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params
            const userId = 'usr_1' // TODO: from auth

            if (!id) throw new Error('Post ID required')

            const post = await this.moderationService.restorePost(id, userId)

            this.logger?.info('Post restored', { postId: id })
            res.json({ data: this.postResource.toResponse(post) })
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/posts/:id/history - Get edit history
     */
    public async history(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params

            if (!id) throw new Error('Post ID required')

            const history = await this.moderationService.getEditHistory(id)

            this.logger?.info('Edit history retrieved', { postId: id, editCount: history.length })
            res.json({ data: history })
        } catch (error) {
            next(error)
        }
    }
}
