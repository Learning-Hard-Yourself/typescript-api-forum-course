/**
 * Reports Routes - Uses middleware pipeline with variadic tuples.
 * 
 * Concepts used:
 * - MiddlewarePipeline with variadic tuple types
 * - Template literal route types
 * - HttpStatus enum
 */

import { DismissReportController } from '@/app/features/reports/controllers/DismissReportController'
import { IndexReportsController } from '@/app/features/reports/controllers/IndexReportsController'
import { ResolveReportController } from '@/app/features/reports/controllers/ResolveReportController'
import { ShowReportController } from '@/app/features/reports/controllers/ShowReportController'
import { StatsReportsController } from '@/app/features/reports/controllers/StatsReportsController'
import { StoreReportController } from '@/app/features/reports/controllers/StoreReportController'
import { ReportCreator } from '@/app/features/reports/use-cases/ReportCreator'
import { ReportDismisser } from '@/app/features/reports/use-cases/ReportDismisser'
import { ReportFinder } from '@/app/features/reports/use-cases/ReportFinder'
import { ReportLister } from '@/app/features/reports/use-cases/ReportLister'
import { ReportResolver } from '@/app/features/reports/use-cases/ReportResolver'
import { ReportStatsRetriever } from '@/app/features/reports/use-cases/ReportStatsRetriever'
import {
    MiddlewarePipeline,
    authMiddleware,
    loggingMiddleware,
    rateLimitMiddleware,
    requireRoleMiddleware,
} from '@/app/shared/http/middleware/MiddlewarePipeline'
import type { ApiVersion, Resource } from '@/app/shared/types/api-routes'
import type { ApplicationDependencies } from '@/routes/types'
import type { Express, NextFunction, Request, Response } from 'express'

// ============================================
// Route Configuration Types
// ============================================

type ReportRouteVersion = Extract<ApiVersion, 'v1'>
type ReportResource = Extract<Resource, 'reports'>
type BaseReportRoute = `/api/${ReportRouteVersion}/${ReportResource}`

// ============================================
// Middleware Pipelines
// ============================================

// Public pipeline for viewing reports (moderators only)
const viewReportsPipeline = MiddlewarePipeline.create()
    .use(loggingMiddleware())
    .use(rateLimitMiddleware(100))
    .use(authMiddleware())
    .use(requireRoleMiddleware('moderator'))

// Admin pipeline for resolving/dismissing reports
const manageReportsPipeline = viewReportsPipeline
    .use(requireRoleMiddleware('admin'))

// Pipeline for creating reports (any authenticated user)
const createReportPipeline = MiddlewarePipeline.create()
    .use(loggingMiddleware())
    .use(rateLimitMiddleware(10))
    .use(authMiddleware())

// ============================================
// Routes Class
// ============================================

export class ReportRoutes {
    private readonly indexController: IndexReportsController
    private readonly showController: ShowReportController
    private readonly storeController: StoreReportController
    private readonly resolveController: ResolveReportController
    private readonly dismissController: DismissReportController
    private readonly statsController: StatsReportsController
    private readonly basePath: BaseReportRoute = '/api/v1/reports'

    constructor(dependencies: ApplicationDependencies) {
        const logger = dependencies.logger?.child({ context: 'Reports' })

        // Use cases
        const reportCreator = new ReportCreator()
        const reportFinder = new ReportFinder()
        const reportLister = new ReportLister()
        const reportResolver = new ReportResolver()
        const reportDismisser = new ReportDismisser()
        const reportStatsRetriever = new ReportStatsRetriever()

        // Controllers
        this.indexController = new IndexReportsController(reportLister, logger)
        this.showController = new ShowReportController(reportFinder, logger)
        this.storeController = new StoreReportController(reportCreator, logger)
        this.resolveController = new ResolveReportController(reportResolver, logger)
        this.dismissController = new DismissReportController(reportDismisser, logger)
        this.statsController = new StatsReportsController(reportStatsRetriever, logger)
    }

    public map(server: Express): void {
        // GET /api/v1/reports - List all reports (moderators)
        server.get(
            this.basePath,
            ...viewReportsPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.indexController.handle(req, res, next),
        )

        // GET /api/v1/reports/stats - Get report statistics (moderators)
        server.get(
            `${this.basePath}/stats`,
            ...viewReportsPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.statsController.handle(req, res, next),
        )

        // GET /api/v1/reports/:id - Get single report (moderators)
        server.get(
            `${this.basePath}/:id`,
            ...viewReportsPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.showController.handle(req, res, next),
        )

        // POST /api/v1/reports - Create a report (authenticated users)
        server.post(
            this.basePath,
            ...createReportPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.storeController.handle(req, res, next),
        )

        // POST /api/v1/reports/:id/resolve - Resolve a report (admins)
        server.post(
            `${this.basePath}/:id/resolve`,
            ...manageReportsPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.resolveController.handle(req, res, next),
        )

        // POST /api/v1/reports/:id/dismiss - Dismiss a report (admins)
        server.post(
            `${this.basePath}/:id/dismiss`,
            ...manageReportsPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.dismissController.handle(req, res, next),
        )
    }
}

// Export pipeline types for reference
export type ViewReportsPipeline = typeof viewReportsPipeline
export type ManageReportsPipeline = typeof manageReportsPipeline
export type CreateReportPipeline = typeof createReportPipeline
