import type { Express } from 'express'

import { CategoriesController } from '@/app/Http/Controllers/CategoriesController'
import { CategoryCreationRequest } from '@/app/Http/Requests/CategoryCreationRequest'
import { CategoryResource } from '@/app/Http/Resources/CategoryResource'
import { CategoryService } from '@/app/Services/CategoryService'
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
        server.get('/api/categories', (request, response, next) => this.controller.index(request, response, next))
        server.post('/api/categories', (request, response, next) => this.controller.store(request, response, next))
    }
}
