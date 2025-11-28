import type { NextFunction, Request, Response } from 'express'

import type { CategoryResource } from '@/app/features/categories/resources/CategoryResource'
import type { CategoryService } from '@/app/features/categories/services/CategoryService'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for showing a single category.
 * GET /api/v1/categories/:id
 */
export class ShowCategoryController {
    public constructor(
        private readonly categoryResource: CategoryResource,
        private readonly categoryService: CategoryService,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = request.params
            if (!id) {
                response.status(400).json({ message: 'Category ID is required' })
                return
            }

            const category = await this.categoryService.findById(id)
            const data = this.categoryResource.toResponse(category)
            response.status(200).json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
