import type { NextFunction, Request, Response } from 'express'

import type { CategoryResource } from '@/app/features/categories/resources/CategoryResource'
import type { CategoryService } from '@/app/features/categories/services/CategoryService'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for listing all categories.
 * GET /api/v1/categories
 */
export class IndexCategoriesController {
    public constructor(
        private readonly categoryResource: CategoryResource,
        private readonly categoryService: CategoryService,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const categories = await this.categoryService.getAll()
            const data = categories.map((cat) => this.categoryResource.toResponse(cat))
            response.status(200).json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
