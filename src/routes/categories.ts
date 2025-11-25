import type { Express } from 'express'

import { CategoriesController } from '@/app/features/categories/controllers/CategoriesController'
import { CategoryCreationRequest } from '@/app/features/categories/requests/CategoryCreationRequest'
import { CategoryResource } from '@/app/features/categories/resources/CategoryResource'
import { CategoryService } from '@/app/features/categories/services/CategoryService'
import type { ApplicationDependencies } from '@/routes/types'

export class CategoryRoutes {
    private readonly controller: CategoriesController

    public constructor(dependencies: ApplicationDependencies) {
        const categoryService = new CategoryService(dependencies.database)
        this.controller = new CategoriesController(
            new CategoryCreationRequest(),
            new CategoryResource(),
            categoryService,
            dependencies.logger?.child({ context: 'CategoriesController' }),
        )
    }

    public map(server: Express): void {
        server.get('/api/v1/categories', (request, response, next) => this.controller.index(request, response, next))
        server.post('/api/v1/categories', (request, response, next) => this.controller.store(request, response, next))
    }
}
