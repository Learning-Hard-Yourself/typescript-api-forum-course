import type { Express } from 'express'

import { PostsController } from '@/app/Http/Controllers/PostsController'
import { PostCreationRequest } from '@/app/Http/Requests/PostCreationRequest'
import { PostResource } from '@/app/Http/Resources/PostResource'
import { PostService } from '@/app/Services/PostService'
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
