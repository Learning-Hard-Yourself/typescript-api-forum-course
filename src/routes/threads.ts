import type { Express } from 'express'

import { ThreadsController } from '@/app/features/threads/controllers/ThreadsController'
import { ThreadCreationRequest } from '@/app/features/threads/requests/ThreadCreationRequest'
import { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import { ThreadService } from '@/app/features/threads/services/ThreadService'
import type { ApplicationDependencies } from '@/routes/types'

export class ThreadRoutes {
    private readonly controller: ThreadsController

    public constructor(dependencies: ApplicationDependencies) {
        const threadService = new ThreadService(dependencies.database)
        this.controller = new ThreadsController(
            new ThreadCreationRequest(),
            new ThreadResource(),
            threadService,
            dependencies.logger?.child({ context: 'ThreadsController' }),
        )
    }

    public map(server: Express): void {
        server.post('/api/threads', (request, response, next) => this.controller.store(request, response, next))
    }
}
