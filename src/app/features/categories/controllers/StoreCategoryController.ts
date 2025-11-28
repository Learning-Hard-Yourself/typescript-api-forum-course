import type { NextFunction, Request, Response } from 'express'

import type { CategoryCreationRequest } from '@/app/features/categories/requests/CategoryCreationRequest'
import type { CategoryResource } from '@/app/features/categories/resources/CategoryResource'
import type { CategoryCreator } from '@/app/features/categories/use-cases/CategoryCreator'
import { ConflictError } from '@/app/shared/errors/ConflictError'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import { headers } from '@/app/shared/http/ResponseHeaders'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for creating a new category.
 * POST /api/v1/categories
 */
export class StoreCategoryController {
    public constructor(
        private readonly creationRequest: CategoryCreationRequest,
        private readonly categoryResource: CategoryResource,
        private readonly categoryCreator: CategoryCreator,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const attributes = this.creationRequest.validate(request.body)
            const category = await this.categoryCreator.execute({ attributes })
            const data = this.categoryResource.toResponse(category)
            this.logger?.info('Category created', { categoryId: category.id })

            headers(response)
                .location({ basePath: '/api/v1/categories', resourceId: category.id })

            response.status(201).json({ data })
        } catch (error) {
            if (error instanceof ValidationError) {
                this.logger?.warn('Validation failed on category creation', { errors: error.details })
            } else if (error instanceof ConflictError) {
                this.logger?.warn('Category creation conflict', { details: error.context })
            } else {
                this.logger?.error(error as Error)
            }
            next(error)
        }
    }
}
