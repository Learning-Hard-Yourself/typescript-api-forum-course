import type { Express } from 'express'

import { PostsController } from '@/app/features/posts/controllers/PostsController'
import { PostCreationRequest } from '@/app/features/posts/requests/PostCreationRequest'
import { PostDeleteRequest } from '@/app/features/posts/requests/PostDeleteRequest'
import { PostEditRequest } from '@/app/features/posts/requests/PostEditRequest'
import { PostReplyRequest } from '@/app/features/posts/requests/PostReplyRequest'
import { PostResource } from '@/app/features/posts/resources/PostResource'
import { PostModerationService } from '@/app/features/posts/services/PostModerationService'
import { PostService } from '@/app/features/posts/services/PostService'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { rateLimiters } from '@/app/shared/http/middleware/RateLimitMiddleware'
import { validateIdParam, validateThreadIdParam } from '@/app/shared/http/middleware/ValidateUuidMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class PostRoutes {
    private readonly controller: PostsController

    public constructor(dependencies: ApplicationDependencies) {
        const postService = new PostService(dependencies.database)
        const moderationService = new PostModerationService(dependencies.database)

        this.controller = new PostsController(
            new PostCreationRequest(),
            new PostReplyRequest(),
            new PostEditRequest(),
            new PostDeleteRequest(),
            new PostResource(),
            postService,
            moderationService,
            dependencies.logger?.child({ context: 'PostsController' }),
        )
    }

    public map(server: Express): void {
        server.get('/api/v1/posts/:id', validateIdParam, (request, response, next) => this.controller.show(request, response, next))
        server.post('/api/v1/posts', authMiddleware, rateLimiters.createPost, (request, response, next) => this.controller.store(request, response, next))
        server.post('/api/v1/posts/:id/reply', authMiddleware, validateIdParam, rateLimiters.createReply, (request, response, next) => this.controller.reply(request, response, next))
        server.get('/api/v1/threads/:threadId/posts', validateThreadIdParam, (request, response, next) => this.controller.getThreadPosts(request, response, next))
        server.patch('/api/v1/posts/:id', authMiddleware, validateIdParam, (request, response, next) => this.controller.edit(request, response, next))
        server.delete('/api/v1/posts/:id', authMiddleware, validateIdParam, (request, response, next) => this.controller.delete(request, response, next))
        server.post('/api/v1/posts/:id/restore', authMiddleware, validateIdParam, (request, response, next) => this.controller.restore(request, response, next))
        server.get('/api/v1/posts/:id/history', validateIdParam, (request, response, next) => this.controller.history(request, response, next))
    }
}
