import type { Express } from 'express'

import { IndexThreadsController } from '@/app/features/threads/controllers/IndexThreadsController'
import { LockThreadController } from '@/app/features/threads/controllers/LockThreadController'
import { PinThreadController } from '@/app/features/threads/controllers/PinThreadController'
import { ShowThreadController } from '@/app/features/threads/controllers/ShowThreadController'
import { StoreThreadController } from '@/app/features/threads/controllers/StoreThreadController'
import { UnlockThreadController } from '@/app/features/threads/controllers/UnlockThreadController'
import { UnpinThreadController } from '@/app/features/threads/controllers/UnpinThreadController'
import { UpdateThreadController } from '@/app/features/threads/controllers/UpdateThreadController'
import { ThreadCreationRequest } from '@/app/features/threads/requests/ThreadCreationRequest'
import { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import { ThreadService } from '@/app/features/threads/services/ThreadService'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { rateLimiters } from '@/app/shared/http/middleware/RateLimitMiddleware'
import { createRequireOwnership } from '@/app/shared/http/middleware/RequireOwnershipMiddleware'
import { requireAnyRole } from '@/app/shared/http/middleware/RequireRoleMiddleware'
import { validateIdParam } from '@/app/shared/http/middleware/ValidateUuidMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class ThreadRoutes {
    private readonly indexController: IndexThreadsController
    private readonly showController: ShowThreadController
    private readonly storeController: StoreThreadController
    private readonly updateController: UpdateThreadController
    private readonly pinController: PinThreadController
    private readonly unpinController: UnpinThreadController
    private readonly lockController: LockThreadController
    private readonly unlockController: UnlockThreadController
    private readonly requireOwnership: ReturnType<typeof createRequireOwnership>

    public constructor(dependencies: ApplicationDependencies) {
        const threadService = new ThreadService(dependencies.database)
        const threadResource = new ThreadResource()
        const logger = dependencies.logger?.child({ context: 'Threads' })

        this.indexController = new IndexThreadsController(threadService, logger)
        this.showController = new ShowThreadController(threadResource, threadService, logger)
        this.storeController = new StoreThreadController(new ThreadCreationRequest(), threadResource, threadService, logger)
        this.updateController = new UpdateThreadController(threadResource, threadService, logger)
        this.pinController = new PinThreadController(threadResource, threadService, logger)
        this.unpinController = new UnpinThreadController(threadResource, threadService, logger)
        this.lockController = new LockThreadController(threadResource, threadService, logger)
        this.unlockController = new UnlockThreadController(threadResource, threadService, logger)
        this.requireOwnership = createRequireOwnership(dependencies.database)
    }

    public map(server: Express): void {
        server.get('/api/v1/threads', (req, res, next) => this.indexController.handle(req, res, next))
        server.get('/api/v1/threads/:id', validateIdParam, (req, res, next) => this.showController.handle(req, res, next))
        server.post('/api/v1/threads', authMiddleware, rateLimiters.createThread, (req, res, next) => this.storeController.handle(req, res, next))
        server.patch('/api/v1/threads/:id', authMiddleware, validateIdParam, this.requireOwnership('thread'), (req, res, next) => this.updateController.handle(req, res, next))
        server.post('/api/v1/threads/:id/pin', authMiddleware, validateIdParam, requireAnyRole('moderator', 'admin'), (req, res, next) => this.pinController.handle(req, res, next))
        server.post('/api/v1/threads/:id/unpin', authMiddleware, validateIdParam, requireAnyRole('moderator', 'admin'), (req, res, next) => this.unpinController.handle(req, res, next))
        server.post('/api/v1/threads/:id/lock', authMiddleware, validateIdParam, requireAnyRole('moderator', 'admin'), (req, res, next) => this.lockController.handle(req, res, next))
        server.post('/api/v1/threads/:id/unlock', authMiddleware, validateIdParam, requireAnyRole('moderator', 'admin'), (req, res, next) => this.unlockController.handle(req, res, next))
    }
}
