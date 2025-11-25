import type { Express } from 'express'

import { PostsController } from '@/app/features/posts/controllers/PostsController'
import { PostCreationRequest } from '@/app/features/posts/requests/PostCreationRequest'
import { PostReplyRequest } from '@/app/features/posts/requests/PostReplyRequest'
import { PostResource } from '@/app/features/posts/resources/PostResource'
import { PostService } from '@/app/features/posts/services/PostService'
import type { ApplicationDependencies } from '@/routes/types'

export class PostRoutes {
    private readonly controller: PostsController

    public constructor(dependencies: ApplicationDependencies) {
        const postService = new PostService(dependencies.database)
        this.controller = new PostsController(
            new PostCreationRequest(),
            new PostReplyRequest(),
            new PostResource(),
            postService,
            dependencies.database,  // Add database
            dependencies.logger?.child({ context: 'PostsController' }),
        )
    }

    public map(server: Express): void {
        // Create top-level post
        server.post('/api/posts', (request, response, next) => this.controller.store(request, response, next))

        // Create reply to a post
        server.post('/api/posts/:postId/reply', (request, response, next) => this.controller.reply(request, response, next))

        // Get thread posts with nested structure
        server.get('/api/threads/:threadId/posts', (request, response, next) =>
            this.controller.getThreadPosts(request, response, next),
        )

        // Moderation endpoints
        server.patch('/api/posts/:id', (request, response, next) => this.controller.edit(request, response, next))
        server.delete('/api/posts/:id', (request, response, next) => this.controller.delete(request, response, next))
        server.post('/api/posts/:id/restore', (request, response, next) => this.controller.restore(request, response, next))
        server.get('/api/posts/:id/history', (request, response, next) => this.controller.history(request, response, next))
    }
}
