import type { NextFunction, Request, Response } from 'express'

import type { CategoryResource } from '@/app/features/categories/resources/CategoryResource'
import type { CategoryFinder } from '@/app/features/categories/use-cases/CategoryFinder'
import { CachePresets, headers } from '@/app/shared/http/ResponseHeaders'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for showing a single category.
 * GET /api/v1/categories/:id
 */
export class ShowCategoryController {
    public constructor(
        private readonly categoryResource: CategoryResource,
        private readonly categoryFinder: CategoryFinder,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = request.params
            if (!id) {
                response.status(400).json({ message: 'Category ID is required' })
                return
            }

            const category = await this.categoryFinder.execute({ id })
            const data = this.categoryResource.toResponse(category)

            headers(response)
                .cache(CachePresets.publicShort)
                .etag({ data })

            response.status(200).json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
