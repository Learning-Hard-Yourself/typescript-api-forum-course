import type { Express } from 'express'

import { ThreadsController } from '@/app/features/threads/controllers/ThreadsController'
import { ThreadCreationRequest } from '@/app/features/threads/requests/ThreadCreationRequest'
import { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import { ThreadService } from '@/app/features/threads/services/ThreadService'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { rateLimiters } from '@/app/shared/http/middleware/RateLimitMiddleware'
import { createRequireOwnership } from '@/app/shared/http/middleware/RequireOwnershipMiddleware'
import { requireAnyRole } from '@/app/shared/http/middleware/RequireRoleMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class ThreadRoutes {
    private readonly controller: ThreadsController
    private readonly requireOwnership: ReturnType<typeof createRequireOwnership>

    public constructor(dependencies: ApplicationDependencies) {
        const threadService = new ThreadService(dependencies.database)
        this.controller = new ThreadsController(
            new ThreadCreationRequest(),
            new ThreadResource(),
            threadService,
            dependencies.logger?.child({ context: 'ThreadsController' }),
        )
        this.requireOwnership = createRequireOwnership(dependencies.database)
    }

    public map(server: Express): void {
        server.get('/api/v1/threads', (request, response, next) => this.controller.list(request, response, next))
        server.post('/api/v1/threads', authMiddleware, rateLimiters.createThread, (request, response, next) => this.controller.store(request, response, next))
        server.patch('/api/v1/threads/:id', authMiddleware, this.requireOwnership('thread'), (request, response, next) => this.controller.update(request, response, next))
        server.post('/api/v1/threads/:id/pin', authMiddleware, requireAnyRole('moderator', 'admin'), (request, response, next) => this.controller.pin(request, response, next))
        server.post('/api/v1/threads/:id/unpin', authMiddleware, requireAnyRole('moderator', 'admin'), (request, response, next) => this.controller.unpin(request, response, next))
        server.post('/api/v1/threads/:id/lock', authMiddleware, requireAnyRole('moderator', 'admin'), (request, response, next) => this.controller.lock(request, response, next))
        server.post('/api/v1/threads/:id/unlock', authMiddleware, requireAnyRole('moderator', 'admin'), (request, response, next) => this.controller.unlock(request, response, next))
    }
}
