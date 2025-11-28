import type { Express } from 'express'

import { DeletePostController } from '@/app/features/posts/controllers/DeletePostController'
import { EditPostController } from '@/app/features/posts/controllers/EditPostController'
import { HistoryPostController } from '@/app/features/posts/controllers/HistoryPostController'
import { IndexThreadPostsController } from '@/app/features/posts/controllers/IndexThreadPostsController'
import { ReplyPostController } from '@/app/features/posts/controllers/ReplyPostController'
import { RestorePostController } from '@/app/features/posts/controllers/RestorePostController'
import { ShowPostController } from '@/app/features/posts/controllers/ShowPostController'
import { StorePostController } from '@/app/features/posts/controllers/StorePostController'
import { PostCreationRequest } from '@/app/features/posts/requests/PostCreationRequest'
import { PostDeleteRequest } from '@/app/features/posts/requests/PostDeleteRequest'
import { PostEditRequest } from '@/app/features/posts/requests/PostEditRequest'
import { PostReplyRequest } from '@/app/features/posts/requests/PostReplyRequest'
import { PostResource } from '@/app/features/posts/resources/PostResource'
import { PostModerationService } from '@/app/features/posts/services/PostModerationService'
import { PostCreator } from '@/app/features/posts/use-cases/PostCreator'
import { PostFinder } from '@/app/features/posts/use-cases/PostFinder'
import { PostReplier } from '@/app/features/posts/use-cases/PostReplier'
import { ThreadPostsLister } from '@/app/features/posts/use-cases/ThreadPostsLister'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { rateLimiters } from '@/app/shared/http/middleware/RateLimitMiddleware'
import { validateIdParam, validateThreadIdParam } from '@/app/shared/http/middleware/ValidateUuidMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class PostRoutes {
    private readonly showController: ShowPostController
    private readonly storeController: StorePostController
    private readonly replyController: ReplyPostController
    private readonly indexThreadPostsController: IndexThreadPostsController
    private readonly editController: EditPostController
    private readonly deleteController: DeletePostController
    private readonly restoreController: RestorePostController
    private readonly historyController: HistoryPostController

    public constructor(dependencies: ApplicationDependencies) {
        const moderationService = new PostModerationService(dependencies.database)
        const postResource = new PostResource()
        const logger = dependencies.logger?.child({ context: 'Posts' })

        // Use cases
        const postFinder = new PostFinder(dependencies.database)
        const postCreator = new PostCreator(dependencies.database)
        const postReplier = new PostReplier(dependencies.database)
        const threadPostsLister = new ThreadPostsLister(dependencies.database)

        this.showController = new ShowPostController(postResource, postFinder, logger)
        this.storeController = new StorePostController(new PostCreationRequest(), postResource, postCreator, logger)
        this.replyController = new ReplyPostController(new PostReplyRequest(), postResource, postReplier, logger)
        this.indexThreadPostsController = new IndexThreadPostsController(threadPostsLister, logger)
        this.editController = new EditPostController(new PostEditRequest(), postResource, moderationService, logger)
        this.deleteController = new DeletePostController(new PostDeleteRequest(), moderationService, logger)
        this.restoreController = new RestorePostController(moderationService, logger)
        this.historyController = new HistoryPostController(moderationService, logger)
    }

    public map(server: Express): void {
        server.get('/api/v1/posts/:id', validateIdParam, (req, res, next) => this.showController.handle(req, res, next))
        server.post('/api/v1/posts', authMiddleware, rateLimiters.createPost, (req, res, next) => this.storeController.handle(req, res, next))
        server.post('/api/v1/posts/:id/reply', authMiddleware, validateIdParam, rateLimiters.createReply, (req, res, next) => this.replyController.handle(req, res, next))
        server.get('/api/v1/threads/:threadId/posts', validateThreadIdParam, (req, res, next) => this.indexThreadPostsController.handle(req, res, next))
        server.patch('/api/v1/posts/:id', authMiddleware, validateIdParam, (req, res, next) => this.editController.handle(req, res, next))
        server.delete('/api/v1/posts/:id', authMiddleware, validateIdParam, (req, res, next) => this.deleteController.handle(req, res, next))
        server.post('/api/v1/posts/:id/restore', authMiddleware, validateIdParam, (req, res, next) => this.restoreController.handle(req, res, next))
        server.get('/api/v1/posts/:id/history', validateIdParam, (req, res, next) => this.historyController.handle(req, res, next))
    }
}
