import type { NextFunction, Request, Response } from 'express'

import { ConflictError } from '@/app/Errors/ConflictError'
import { ValidationError } from '@/app/Errors/ValidationError'
import type { CategoryCreationRequest } from '@/app/Http/Requests/CategoryCreationRequest'
import type { CategoryResource } from '@/app/Http/Resources/CategoryResource'
import type { Logger } from '@/app/Logging/Logger'
import type { CategoryService } from '@/app/Services/CategoryService'

export class CategoriesController {
    public constructor(
        private readonly creationRequest: CategoryCreationRequest,
        private readonly categoryResource: CategoryResource,
        private readonly categoryService: CategoryService,
        private readonly logger?: Logger,
    ) { }

    public async index(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const categories = await this.categoryService.getAll()
            const data = categories.map((cat) => this.categoryResource.toResponse(cat))
            response.status(200).json({ data })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    public async store(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            // TODO: Ensure admin only
            const attributes = this.creationRequest.validate(request.body)
            const category = await this.categoryService.create(attributes)
            const data = this.categoryResource.toResponse(category)
            this.logger?.info('Category created', { categoryId: category.id })
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
