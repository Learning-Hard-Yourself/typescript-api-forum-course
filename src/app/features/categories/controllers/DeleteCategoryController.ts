import type { NextFunction, Request, Response } from 'express'

import type { CategoryDeleter } from '@/app/features/categories/use-cases/CategoryDeleter'
import type { Logger } from '@/app/shared/logging/Logger'

export class DeleteCategoryController {
    public constructor(
        private readonly deleter: CategoryDeleter,
        private readonly logger?: Logger,
    ) { }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string
            await this.deleter.execute(id)

            this.logger?.info('Category deleted', { categoryId: id })

            res.status(204).send()
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
