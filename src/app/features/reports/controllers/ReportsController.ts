import { Log } from '@/app/shared/decorators'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import { HttpStatus } from '@/app/shared/http/HttpStatus'
import { headers } from '@/app/shared/http/ResponseHeaders'
import { createPostId, createReportId, createThreadId, createUserId } from '@/app/shared/types/branded'
import type { NextFunction, Request, Response } from 'express'
import type {
    CreateReportInput,
    ReportTarget,
} from '../models/Report'
import { ReportPriority, ReportStatus, ReportType } from '../models/Report'
import type { ReportCreator } from '../use-cases/ReportCreator'
import type { ReportDismisser } from '../use-cases/ReportDismisser'
import type { ReportFinder } from '../use-cases/ReportFinder'
import type { ReportFilters, ReportLister } from '../use-cases/ReportLister'
import type { ReportResolver } from '../use-cases/ReportResolver'
import type { ReportStatsRetriever } from '../use-cases/ReportStatsRetriever'

export class ReportsController {
    constructor(
        private readonly reportCreator: ReportCreator,
        private readonly reportFinder: ReportFinder,
        private readonly reportLister: ReportLister,
        private readonly reportResolver: ReportResolver,
        private readonly reportDismisser: ReportDismisser,
        private readonly reportStatsRetriever: ReportStatsRetriever,
    ) {}

    @Log
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { targetType, targetId, reportType, description, priority } = req.body

            if (!targetType || !targetId || !reportType || !description) {
                throw new ValidationError([
                    { field: 'body', message: 'Missing required fields' },
                ])
            }

            const target = this.buildReportTarget(targetType, targetId, req.body)

            const input: CreateReportInput = {
                reporterId: createUserId(req.userId ?? 'anonymous'),
                target,
                reportType: this.parseReportType(reportType),
                description,
                priority: priority ? this.parsePriority(priority) : undefined,
            }

            const report = await this.reportCreator.execute(input)

            headers(res)
                .location({ basePath: '/api/v1/reports', resourceId: report.id })

            res.status(HttpStatus.Created).json({ data: report })
        } catch (error) {
            next(error)
        }
    }

    @Log
    async index(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status, priority, type, reporterId } = req.query

            const filters: ReportFilters = {}
            
            if (status && typeof status === 'string') {
                filters.status = status as ReportStatus
            }
            if (priority && typeof priority === 'string') {
                filters.priority = parseInt(priority) as ReportPriority
            }
            if (type && typeof type === 'string') {
                filters.reportType = type as ReportType
            }
            if (reporterId && typeof reporterId === 'string') {
                filters.reporterId = createUserId(reporterId)
            }

            const reports = await this.reportLister.execute(filters)

            res.status(HttpStatus.OK).json({ data: reports, meta: { total: reports.length } })
        } catch (error) {
            next(error)
        }
    }

    @Log
    async show(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const reportId = createReportId(req.params.id ?? '')
            const report = await this.reportFinder.execute({ id: reportId })

            if (!report) {
                throw new NotFoundError('Report not found', { reportId })
            }

            res.status(HttpStatus.OK).json({ data: report })
        } catch (error) {
            next(error)
        }
    }

    @Log
    async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const reportId = createReportId(req.params.id ?? '')
            const { resolution } = req.body

            if (!resolution) {
                throw new ValidationError([
                    { field: 'resolution', message: 'Resolution is required' },
                ])
            }

            const resolvedBy = createUserId(req.userId ?? 'system')
            const report = await this.reportResolver.execute({ id: reportId, resolution, resolvedBy })

            res.status(HttpStatus.OK).json({ data: report })
        } catch (error) {
            next(error)
        }
    }

    @Log
    async dismiss(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const reportId = createReportId(req.params.id ?? '')
            const { reason } = req.body

            if (!reason) {
                throw new ValidationError([
                    { field: 'reason', message: 'Reason is required' },
                ])
            }

            const dismissedBy = createUserId(req.userId ?? 'system')
            const report = await this.reportDismisser.execute({ id: reportId, reason, dismissedBy })

            res.status(HttpStatus.OK).json({ data: report })
        } catch (error) {
            next(error)
        }
    }

    @Log
    async stats(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const counts = await this.reportStatsRetriever.execute()
            res.status(HttpStatus.OK).json({ data: counts })
        } catch (error) {
            next(error)
        }
    }

    private buildReportTarget(
        targetType: string, 
        targetId: string, 
        body: Record<string, unknown>
    ): ReportTarget {
        switch (targetType) {
            case 'post':
                return {
                    type: 'post',
                    postId: createPostId(targetId),
                    threadId: createThreadId(body.threadId as string),
                }
            case 'thread':
                return {
                    type: 'thread',
                    threadId: createThreadId(targetId),
                }
            case 'user':
                return {
                    type: 'user',
                    userId: createUserId(targetId),
                }
            default:
                throw new ValidationError([
                    { field: 'targetType', message: `Invalid target type: ${targetType}` },
                ])
        }
    }

    private parseReportType(type: string): ReportType {
        const validTypes = Object.values(ReportType)
        if (!validTypes.includes(type as ReportType)) {
            throw new ValidationError([
                { field: 'reportType', message: `Invalid report type: ${type}` },
            ])
        }
        return type as ReportType
    }

    private parsePriority(priority: string | number): ReportPriority {
        const p = typeof priority === 'string' ? parseInt(priority) : priority
        if (p < 1 || p > 4) {
            throw new ValidationError([
                { field: 'priority', message: 'Priority must be between 1 and 4' },
            ])
        }
        return p as ReportPriority
    }
}

// Type for the controller methods
export type ReportsControllerMethod = keyof ReportsController
