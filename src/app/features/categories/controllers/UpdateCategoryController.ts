import type { NextFunction, Request, Response } from 'express'

import type { CategoryUpdateRequest } from '@/app/features/categories/requests/CategoryUpdateRequest'
import { CategoryResource } from '@/app/features/categories/resources/CategoryResource'
import type { CategoryUpdater } from '@/app/features/categories/use-cases/CategoryUpdater'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { Logger } from '@/app/shared/logging/Logger'

export class UpdateCategoryController {
    public constructor(
        private readonly request: CategoryUpdateRequest,
        private readonly updater: CategoryUpdater,
        private readonly logger?: Logger,
    ) { }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string
            const payload = this.request.validate(req.body)
            const category = await this.updater.execute(id, payload)

            this.logger?.info('Category updated', { categoryId: category.id })

            res.status(200).json(new CategoryResource(category).toResponse())
        } catch (error) {
            if (error instanceof ValidationError) {
                this.logger?.warn('Validation failed on category update', { errors: error.details })
            } else {
                this.logger?.error(error as Error)
            }
            next(error)
        }
    }
}
