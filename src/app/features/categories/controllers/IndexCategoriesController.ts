import type { NextFunction, Request, Response } from 'express'

import { CategoryResource } from '@/app/features/categories/resources/CategoryResource'
import type { CategoryLister } from '@/app/features/categories/use-cases/CategoryLister'
import { CachePresets, headers } from '@/app/shared/http/ResponseHeaders'
import type { Logger } from '@/app/shared/logging/Logger'
import { jsonCollection } from '@/app/shared/resources/JsonResource'

export class IndexCategoriesController {
    public constructor(
        private readonly categoryLister: CategoryLister,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const categories = await this.categoryLister.execute()
            const data = categories.map((cat) => new CategoryResource(cat).toArray())

            headers(response)
                .cache(CachePresets.publicShort)
                .etag({ data })

            response.status(200).json(jsonCollection(data))
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }
}
