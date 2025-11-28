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

    public async show(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = request.params
            if (!id) {
                response.status(400).json({ message: 'Thread ID is required' })
                return
            }

            const thread = await this.threadService.findById(id)
            const data = this.threadResource.toResponse(thread)
            response.status(200).json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    public async store(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id

            const attributes = this.creationRequest.validate(request.body)
            const thread = await this.threadService.create(userId, attributes)
            const data = this.threadResource.toResponse(thread)
            this.logger?.info('Thread created', { threadId: thread.id, userId })
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


    public async update(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user!.id
            const userRole = (request.user!.role ?? 'user') as UserRole
            const { id } = request.params

            if (!id) {
                throw new Error('Thread ID is required')
            }

            const validatedData = ThreadUpdateRequestSchema.parse(request.body)

            const thread = await this.threadService.updateThread(id, userId, userRole, validatedData)
            const data = this.threadResource.toResponse(thread)

            this.logger?.info('Thread updated', { threadId: id, userId })
            response.status(200).json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    public async pin(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole = (request.user!.role ?? 'user') as UserRole
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

    public async unpin(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole = (request.user!.role ?? 'user') as UserRole
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

    public async lock(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole = (request.user!.role ?? 'user') as UserRole
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

    public async unlock(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userRole = (request.user!.role ?? 'user') as UserRole
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
