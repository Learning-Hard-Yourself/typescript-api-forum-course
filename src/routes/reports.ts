/**
 * Reports Routes - Uses middleware pipeline with variadic tuples.
 * 
 * Concepts used:
 * - MiddlewarePipeline with variadic tuple types
 * - Template literal route types
 * - HttpStatus enum
 */

import { ReportsController } from '@/app/features/reports/controllers/ReportsController'
import { ReportService } from '@/app/features/reports/services/ReportService'
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
    private readonly controller: ReportsController
    private readonly basePath: BaseReportRoute = '/api/v1/reports'

    constructor(private readonly dependencies: ApplicationDependencies) {
        const service = new ReportService(dependencies.database)
        this.controller = new ReportsController(service)
    }

    public map(server: Express): void {
        // GET /api/v1/reports - List all reports (moderators)
        server.get(
            this.basePath,
            ...viewReportsPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.controller.index(req, res, next),
        )

        // GET /api/v1/reports/stats - Get report statistics (moderators)
        server.get(
            `${this.basePath}/stats`,
            ...viewReportsPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.controller.stats(req, res, next),
        )

        // GET /api/v1/reports/:id - Get single report (moderators)
        server.get(
            `${this.basePath}/:id`,
            ...viewReportsPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.controller.show(req, res, next),
        )

        // POST /api/v1/reports - Create a report (authenticated users)
        server.post(
            this.basePath,
            ...createReportPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.controller.create(req, res, next),
        )

        // POST /api/v1/reports/:id/resolve - Resolve a report (admins)
        server.post(
            `${this.basePath}/:id/resolve`,
            ...manageReportsPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.controller.resolve(req, res, next),
        )

        // POST /api/v1/reports/:id/dismiss - Dismiss a report (admins)
        server.post(
            `${this.basePath}/:id/dismiss`,
            ...manageReportsPipeline.getHandlers(),
            (req: Request, res: Response, next: NextFunction) => 
                this.controller.dismiss(req, res, next),
        )
    }
}

// Export pipeline types for reference
export type ViewReportsPipeline = typeof viewReportsPipeline
export type ManageReportsPipeline = typeof manageReportsPipeline
export type CreateReportPipeline = typeof createReportPipeline
