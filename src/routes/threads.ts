import type { Express } from 'express'

import { IndexThreadsCursorController } from '@/app/features/threads/controllers/IndexThreadsCursorController'
import { LockThreadController } from '@/app/features/threads/controllers/LockThreadController'
import { PinThreadController } from '@/app/features/threads/controllers/PinThreadController'
import { ShowThreadController } from '@/app/features/threads/controllers/ShowThreadController'
import { StoreThreadController } from '@/app/features/threads/controllers/StoreThreadController'
import { UnlockThreadController } from '@/app/features/threads/controllers/UnlockThreadController'
import { UnpinThreadController } from '@/app/features/threads/controllers/UnpinThreadController'
import { UpdateThreadController } from '@/app/features/threads/controllers/UpdateThreadController'
import { DrizzleThreadRepository } from '@/app/features/threads/repositories/DrizzleThreadRepository'
import { ThreadCreationRequest } from '@/app/features/threads/requests/ThreadCreationRequest'
import { ThreadCreator } from '@/app/features/threads/use-cases/ThreadCreator'
import { ThreadCursorLister } from '@/app/features/threads/use-cases/ThreadCursorLister'
import { ThreadFinder } from '@/app/features/threads/use-cases/ThreadFinder'
import { ThreadLocker } from '@/app/features/threads/use-cases/ThreadLocker'
import { ThreadPinner } from '@/app/features/threads/use-cases/ThreadPinner'
import { ThreadUpdater } from '@/app/features/threads/use-cases/ThreadUpdater'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { rateLimiters } from '@/app/shared/http/middleware/RateLimitMiddleware'
import { createRequireOwnership } from '@/app/shared/http/middleware/RequireOwnershipMiddleware'
import { requireAnyRole } from '@/app/shared/http/middleware/RequireRoleMiddleware'
import { validateIdParam } from '@/app/shared/http/middleware/ValidateUuidMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class ThreadRoutes {
    private readonly indexController: IndexThreadsCursorController
    private readonly showController: ShowThreadController
    private readonly storeController: StoreThreadController
    private readonly updateController: UpdateThreadController
    private readonly pinController: PinThreadController
    private readonly unpinController: UnpinThreadController
    private readonly lockController: LockThreadController
    private readonly unlockController: UnlockThreadController
    private readonly requireOwnership: ReturnType<typeof createRequireOwnership>

    public constructor(dependencies: ApplicationDependencies) {
        const logger = dependencies.logger?.child({ context: 'Threads' })

        // Repository
        const threadRepository = new DrizzleThreadRepository(dependencies.database)

        // Use cases
        const threadFinder = new ThreadFinder(threadRepository)
        const threadCreator = new ThreadCreator(threadRepository)
        const threadUpdater = new ThreadUpdater(threadRepository)
        const threadPinner = new ThreadPinner(threadRepository)
        const threadLocker = new ThreadLocker(threadRepository)
        const threadCursorLister = new ThreadCursorLister(dependencies.database)

        this.indexController = new IndexThreadsCursorController(threadCursorLister, logger)
        this.showController = new ShowThreadController(threadFinder, logger)
        this.storeController = new StoreThreadController(new ThreadCreationRequest(), threadCreator, logger)
        this.updateController = new UpdateThreadController(threadUpdater, logger)
        this.pinController = new PinThreadController(threadPinner, logger)
        this.unpinController = new UnpinThreadController(threadPinner, logger)
        this.lockController = new LockThreadController(threadLocker, logger)
        this.unlockController = new UnlockThreadController(threadLocker, logger)
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
