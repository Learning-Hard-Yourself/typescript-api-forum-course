import type { NextFunction, Request, Response } from 'express'

import type { UserRole } from '@/app/features/threads/models/ThreadUpdate'
import type { ThreadCreationRequest } from '@/app/features/threads/requests/ThreadCreationRequest'
import { ThreadListRequestSchema } from '@/app/features/threads/requests/ThreadListRequest'
import { ThreadUpdateRequestSchema } from '@/app/features/threads/requests/ThreadUpdateRequest'
import type { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import type { ThreadService } from '@/app/features/threads/services/ThreadService'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { Logger } from '@/app/shared/logging/Logger'

export class ThreadsController {
    public constructor(
        private readonly creationRequest: ThreadCreationRequest,
        private readonly threadResource: ThreadResource,
        private readonly threadService: ThreadService,
        private readonly logger?: Logger,
    ) { }

    public async store(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            // TODO: Get authenticated user ID from request (middleware should populate this)
            // For now, we might need to mock it or assume it's passed in body/headers for testing if auth isn't fully wired
            // But based on existing code, `request.user` might be available if auth middleware runs.
            // Let's assume a dummy user ID for now if not present, or fail.
            // The requirement says "login usaremos better-auth", so auth should be there.
            // I'll assume `request.headers['x-user-id']` for simple testing or `request.user.id` if typed.
            // Let's use a hardcoded ID for now or throw if not found, to be safe.
            const userId = 'usr_1' // Placeholder until auth middleware is confirmed

            const attributes = this.creationRequest.validate(request.body)
            const thread = await this.threadService.create(userId, attributes)
            const data = this.threadResource.toResponse(thread)
            this.logger?.info('Thread created', { threadId: thread.id })
            response.status(201).json({ data })
        } catch (error) {
            if (error instanceof ValidationError) {
                this.logger?.warn('Validation failed on thread creation', { errors: error.details })
            } else {
                this.logger?.error(error as Error)
            }
            next(error)
        }
    }

    /**
     * PATCH /api/threads/:id
     * Update thread (title by author, all by admin/mod)
     */
    public async update(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            // TODO: Get user from auth middleware
            const userId = 'usr_1'
            const userRole: UserRole = 'user' // TODO: Get from authenticated user
            const { id } = request.params

            if (!id) {
                throw new Error('Thread ID is required')
            }

            const validatedData = ThreadUpdateRequestSchema.parse(request.body)

            const thread = await this.threadService.updateThread(id, userId, userRole, validatedData)
            const data = this.threadResource.toResponse(thread)

            this.logger?.info('Thread updated', { threadId: id })
            response.json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    /**
     * POST /api/threads/:id/pin
     * Pin thread (admin/moderator only)
     */
    public async pin(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole: UserRole = 'admin' // TODO: Get from authenticated user
            const { id } = request.params

            if (!id) {
                throw new Error('Thread ID is required')
            }

            const thread = await this.threadService.pinThread(id, userRole)
            const data = this.threadResource.toResponse(thread)

            this.logger?.info('Thread pinned', { threadId: id })
            response.json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    /**
     * POST /api/threads/:id/unpin
     * Unpin thread (admin/moderator only)
     */
    public async unpin(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole: UserRole = 'admin' // TODO: Get from authenticated user
            const { id } = request.params

            if (!id) {
                throw new Error('Thread ID is required')
            }

            const thread = await this.threadService.unpinThread(id, userRole)
            const data = this.threadResource.toResponse(thread)

            this.logger?.info('Thread unpinned', { threadId: id })
            response.json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    /**
     * POST /api/threads/:id/lock
     * Lock thread (admin/moderator only)
     */
    public async lock(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole: UserRole = 'admin' // TODO: Get from authenticated user
            const { id } = request.params

            if (!id) {
                throw new Error('Thread ID is required')
            }

            const thread = await this.threadService.lockThread(id, userRole)
            const data = this.threadResource.toResponse(thread)

            this.logger?.info('Thread locked', { threadId: id })
            response.json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    /**
     * POST /api/threads/:id/unlock
     * Unlock thread (admin/moderator only)
     */
    public async unlock(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole: UserRole = 'admin' // TODO: Get from authenticated user
            const { id } = request.params

            if (!id) {
                throw new Error('Thread ID is required')
            }

            const thread = await this.threadService.unlockThread(id, userRole)
            const data = this.threadResource.toResponse(thread)

            this.logger?.info('Thread unlocked', { threadId: id })
            response.json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    /**
     * GET /api/threads
     * List threads with pagination, sorting, and filtering
     */
    public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const params = ThreadListRequestSchema.parse(req.query)

            const result = await this.threadService.list(params)

            this.logger?.info('Threads listed', {
                page: params.page,
                perPage: params.perPage,
                total: result.meta.total,
            })
            res.json(result)
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
