import type { Express } from 'express'

import { DeletePostController } from '@/app/features/posts/controllers/DeletePostController'
import { EditPostController } from '@/app/features/posts/controllers/EditPostController'
import { HistoryPostController } from '@/app/features/posts/controllers/HistoryPostController'
import { IndexThreadPostsController } from '@/app/features/posts/controllers/IndexThreadPostsController'
import { ReplyPostController } from '@/app/features/posts/controllers/ReplyPostController'
import { RestorePostController } from '@/app/features/posts/controllers/RestorePostController'
import { ShowPostController } from '@/app/features/posts/controllers/ShowPostController'
import { StorePostController } from '@/app/features/posts/controllers/StorePostController'
import { DrizzlePostEditRepository } from '@/app/features/posts/repositories/DrizzlePostEditRepository'
import { DrizzlePostRepository } from '@/app/features/posts/repositories/DrizzlePostRepository'
import { PostCreationRequest } from '@/app/features/posts/requests/PostCreationRequest'
import { PostDeleteRequest } from '@/app/features/posts/requests/PostDeleteRequest'
import { PostEditRequest } from '@/app/features/posts/requests/PostEditRequest'
import { PostReplyRequest } from '@/app/features/posts/requests/PostReplyRequest'
import { PostCreator } from '@/app/features/posts/use-cases/PostCreator'
import { PostDeleter } from '@/app/features/posts/use-cases/PostDeleter'
import { PostEditor } from '@/app/features/posts/use-cases/PostEditor'
import { PostFinder } from '@/app/features/posts/use-cases/PostFinder'
import { PostHistoryLister } from '@/app/features/posts/use-cases/PostHistoryLister'
import { PostReplier } from '@/app/features/posts/use-cases/PostReplier'
import { PostRestorer } from '@/app/features/posts/use-cases/PostRestorer'
import { ThreadPostsLister } from '@/app/features/posts/use-cases/ThreadPostsLister'
import { DrizzleThreadRepository } from '@/app/features/threads/repositories/DrizzleThreadRepository'
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
        const logger = dependencies.logger?.child({ context: 'Posts' })

        const postRepository = new DrizzlePostRepository(dependencies.database)
        const postEditRepository = new DrizzlePostEditRepository(dependencies.database)
        const threadRepository = new DrizzleThreadRepository(dependencies.database)

        const postFinder = new PostFinder(postRepository)
        const postCreator = new PostCreator(postRepository, threadRepository)
        const postReplier = new PostReplier(postRepository, threadRepository)
        const threadPostsLister = new ThreadPostsLister(postRepository, threadRepository)
        const postEditor = new PostEditor(postRepository, postEditRepository)
        const postDeleter = new PostDeleter(postRepository)
        const postRestorer = new PostRestorer(postRepository)
        const postHistoryLister = new PostHistoryLister(postRepository, postEditRepository)

        this.showController = new ShowPostController(postFinder, logger)
        this.storeController = new StorePostController(new PostCreationRequest(), postCreator, logger)
        this.replyController = new ReplyPostController(new PostReplyRequest(), postReplier, logger)
        this.indexThreadPostsController = new IndexThreadPostsController(threadPostsLister, logger)
        this.editController = new EditPostController(new PostEditRequest(), postEditor, logger)
        this.deleteController = new DeletePostController(new PostDeleteRequest(), postDeleter, logger)
        this.restoreController = new RestorePostController(postRestorer, logger)
        this.historyController = new HistoryPostController(postHistoryLister, logger)
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
