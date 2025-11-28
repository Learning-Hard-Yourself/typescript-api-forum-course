import type { NextFunction, Request, Response } from 'express'

import { ThreadResource } from '@/app/features/threads/resources/ThreadResource'
import type { ThreadFinder } from '@/app/features/threads/use-cases/ThreadFinder'
import { CachePresets, headers } from '@/app/shared/http/ResponseHeaders'
import type { Logger } from '@/app/shared/logging/Logger'

export class ShowThreadController {
    public constructor(
        private readonly threadFinder: ThreadFinder,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = request.params
            if (!id) {
                response.status(400).json({ message: 'Thread ID is required' })
                return
            }

            const thread = await this.threadFinder.execute({ id })
            const resource = new ThreadResource(thread)

            headers(response)
                .cache(CachePresets.privateShort)
                .etag({ data: resource.toArray() })

            response.status(200).json(resource.toResponse())
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
