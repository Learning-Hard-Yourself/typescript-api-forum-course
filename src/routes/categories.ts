import type { Express } from 'express'

import { IndexCategoriesController } from '@/app/features/categories/controllers/IndexCategoriesController'
import { ShowCategoryController } from '@/app/features/categories/controllers/ShowCategoryController'
import { StoreCategoryController } from '@/app/features/categories/controllers/StoreCategoryController'
import { DrizzleCategoryRepository } from '@/app/features/categories/repositories/DrizzleCategoryRepository'
import { CategoryCreationRequest } from '@/app/features/categories/requests/CategoryCreationRequest'
import { CategoryCreator } from '@/app/features/categories/use-cases/CategoryCreator'
import { CategoryFinder } from '@/app/features/categories/use-cases/CategoryFinder'
import { CategoryLister } from '@/app/features/categories/use-cases/CategoryLister'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { requireAnyRole } from '@/app/shared/http/middleware/RequireRoleMiddleware'
import { validateIdParam } from '@/app/shared/http/middleware/ValidateUuidMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class CategoryRoutes {
    private readonly indexController: IndexCategoriesController
    private readonly showController: ShowCategoryController
    private readonly storeController: StoreCategoryController

    public constructor(dependencies: ApplicationDependencies) {
        const logger = dependencies.logger?.child({ context: 'Categories' })

        const categoryRepository = new DrizzleCategoryRepository(dependencies.database)

        const categoryFinder = new CategoryFinder(categoryRepository)
        const categoryCreator = new CategoryCreator(categoryRepository)
        const categoryLister = new CategoryLister(categoryRepository)

        this.indexController = new IndexCategoriesController(categoryLister, logger)
        this.showController = new ShowCategoryController(categoryFinder, logger)
        this.storeController = new StoreCategoryController(new CategoryCreationRequest(), categoryCreator, logger)
    }

    public map(server: Express): void {
        server.get('/api/v1/categories', (req, res, next) => this.indexController.handle(req, res, next))
        server.get('/api/v1/categories/:id', validateIdParam, (req, res, next) => this.showController.handle(req, res, next))
        server.post('/api/v1/categories', authMiddleware, requireAnyRole('admin'), (req, res, next) => this.storeController.handle(req, res, next))
    }
}
