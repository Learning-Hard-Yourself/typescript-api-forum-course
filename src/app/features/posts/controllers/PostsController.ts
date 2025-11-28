import type { NextFunction, Request, Response } from 'express'

import type { PostCreationRequest } from '@/app/features/posts/requests/PostCreationRequest'
import type { PostDeleteRequest } from '@/app/features/posts/requests/PostDeleteRequest'
import type { PostEditRequest } from '@/app/features/posts/requests/PostEditRequest'
import type { PostReplyRequest } from '@/app/features/posts/requests/PostReplyRequest'
import { NestedPostResource } from '@/app/features/posts/resources/NestedPostResource'
import type { PostResource } from '@/app/features/posts/resources/PostResource'
import type { PostModerationService } from '@/app/features/posts/services/PostModerationService'
import type { PostService } from '@/app/features/posts/services/PostService'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { Logger } from '@/app/shared/logging/Logger'

export class PostsController {
    public constructor(
        private readonly creationRequest: PostCreationRequest,
        private readonly replyRequest: PostReplyRequest,
        private readonly editRequest: PostEditRequest,
        private readonly deleteRequest: PostDeleteRequest,
        private readonly postResource: PostResource,
        private readonly postService: PostService,
        private readonly moderationService: PostModerationService,
        private readonly logger?: Logger,
    ) { }

    public async show(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = request.params
            if (!id) {
                response.status(400).json({ message: 'Post ID is required' })
                return
            }

            const post = await this.postService.findById(id)
            const data = this.postResource.toResponse(post)
            response.status(200).json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    public async store(request: Request, response: Response, next: NextFunction): Promise<void> {
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

    public async reply(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const parentId = request.params.id

            if (!parentId) {
                response.status(400).json({ message: 'Parent post ID is required' })
                return
            }

            const payload = this.replyRequest.validate(request.body)
            const post = await this.postService.replyToPost(userId, parentId, payload)
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


    public async edit(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const postId = request.params.id
            const payload = this.editRequest.validate(request.body)
            const post = await this.moderationService.editPost(postId, userId, payload.content, payload.reason)
            const data = this.postResource.toResponse(post)
            this.logger?.info('Post edited', { postId, userId })
            response.status(200).json({ data })
        } catch (error) {
            next(error)
        }
    }


    public async delete(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const postId = request.params.id
            if (!postId) throw new Error('Post ID required')

            const payload = this.deleteRequest.validate(request.body)
            await this.moderationService.deletePost(postId, userId, payload.reason)
            this.logger?.info('Post deleted', { postId, userId })
            response.status(204).send()
        } catch (error) {
            next(error)
        }
    }


    public async restore(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const postId = request.params.id
            if (!postId) throw new Error('Post ID required')

            await this.moderationService.restorePost(postId, userId)
            this.logger?.info('Post restored', { postId, userId })
            response.status(200).json({ data: await this.moderationService.getPostWithHistory(postId) })
        } catch (error) {
            next(error)
        }
    }


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
