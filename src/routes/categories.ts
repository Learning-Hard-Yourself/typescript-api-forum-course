import type { Express } from 'express'

import { IndexCategoriesController } from '@/app/features/categories/controllers/IndexCategoriesController'
import { ShowCategoryController } from '@/app/features/categories/controllers/ShowCategoryController'
import { StoreCategoryController } from '@/app/features/categories/controllers/StoreCategoryController'
import { CategoryCreationRequest } from '@/app/features/categories/requests/CategoryCreationRequest'
import { CategoryResource } from '@/app/features/categories/resources/CategoryResource'
import { CategoryService } from '@/app/features/categories/services/CategoryService'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { requireAnyRole } from '@/app/shared/http/middleware/RequireRoleMiddleware'
import { validateIdParam } from '@/app/shared/http/middleware/ValidateUuidMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class CategoryRoutes {
    private readonly indexController: IndexCategoriesController
    private readonly showController: ShowCategoryController
    private readonly storeController: StoreCategoryController

    public constructor(dependencies: ApplicationDependencies) {
        const categoryService = new CategoryService(dependencies.database)
        const categoryResource = new CategoryResource()
        const logger = dependencies.logger?.child({ context: 'Categories' })

        this.indexController = new IndexCategoriesController(categoryResource, categoryService, logger)
        this.showController = new ShowCategoryController(categoryResource, categoryService, logger)
        this.storeController = new StoreCategoryController(new CategoryCreationRequest(), categoryResource, categoryService, logger)
    }

    public map(server: Express): void {
        server.get('/api/v1/categories', (req, res, next) => this.indexController.handle(req, res, next))
        server.get('/api/v1/categories/:id', validateIdParam, (req, res, next) => this.showController.handle(req, res, next))
        server.post('/api/v1/categories', authMiddleware, requireAnyRole('admin'), (req, res, next) => this.storeController.handle(req, res, next))
    }
}
