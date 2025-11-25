import type { Express } from 'express'

import { PostsController } from '@/app/features/posts/controllers/PostsController'
import { PostCreationRequest } from '@/app/features/posts/requests/PostCreationRequest'
import { PostResource } from '@/app/features/posts/resources/PostResource'
import { PostService } from '@/app/features/posts/services/PostService'
import type { ApplicationDependencies } from '@/routes/types'

export class PostRoutes {
    private readonly controller: PostsController

    public constructor(dependencies: ApplicationDependencies) {
        const postService = new PostService(dependencies.database)
        this.controller = new PostsController(
            new PostCreationRequest(),
            new PostResource(),
            postService,
            dependencies.logger?.child({ context: 'PostsController' }),
        )
    }

    public map(server: Express): void {
        server.post('/api/posts', (request, response, next) => this.controller.store(request, response, next))
    }
}
