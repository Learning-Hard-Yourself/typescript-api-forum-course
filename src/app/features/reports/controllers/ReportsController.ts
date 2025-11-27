/**
 * Reports Controller - Uses decorators and middleware pipeline.
 * 
 * Concepts used:
 * - @Log and @Catch decorators
 * - HttpStatus enum
 * - Branded types
 * - Template literal route types
 */

import { Catch, Log } from '@/app/shared/decorators'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import { HttpStatus } from '@/app/shared/http/HttpStatus'
import { createPostId, createReportId, createThreadId, createUserId } from '@/app/shared/types/branded'
import type { NextFunction, Request, Response } from 'express'
import type {
    CreateReportInput,
    ReportTarget,
} from '../models/Report'
import { ReportPriority, ReportStatus, ReportType } from '../models/Report'
import type { ReportFilters } from '../services/ReportService'
import { ReportService } from '../services/ReportService'

// ============================================
// Controller Class
// ============================================

export class ReportsController {
    constructor(private readonly reportService: ReportService) {}

    /**
     * Create a new report
     * POST /api/v1/reports
     */
    @Log
    @Catch
    async create(req: Request, res: Response, _next: NextFunction): Promise<Response> {
        const { targetType, targetId, reportType, description, priority } = req.body

        // Validate required fields
        if (!targetType || !targetId || !reportType || !description) {
            throw new ValidationError([
                { field: 'body', message: 'Missing required fields' },
            ])
        }

        // Build target based on type
        const target = this.buildReportTarget(targetType, targetId, req.body)

        const input: CreateReportInput = {
            reporterId: createUserId(req.userId ?? 'anonymous'),
            target,
            reportType: this.parseReportType(reportType),
            description,
            priority: priority ? this.parsePriority(priority) : undefined,
        }

        const report = await this.reportService.create(input)

        return res.status(HttpStatus.Created).json({
            data: report,
        })
    }

    /**
     * Get all reports with filters
     * GET /api/v1/reports
     */
    @Log
    @Catch
    async index(req: Request, res: Response, _next: NextFunction): Promise<Response> {
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

        const reports = await this.reportService.findAll(filters)

        return res.status(HttpStatus.OK).json({
            data: reports,
            meta: {
                total: reports.length,
            },
        })
    }

    /**
     * Get a single report by ID
     * GET /api/v1/reports/:id
     */
    @Log
    @Catch
    async show(req: Request, res: Response, _next: NextFunction): Promise<Response> {
        const reportId = createReportId(req.params.id ?? '')
        const report = await this.reportService.findById(reportId)

        if (!report) {
            throw new NotFoundError('Report not found', { reportId })
        }

        return res.status(HttpStatus.OK).json({
            data: report,
        })
    }

    /**
     * Resolve a report
     * POST /api/v1/reports/:id/resolve
     */
    @Log
    @Catch
    async resolve(req: Request, res: Response, _next: NextFunction): Promise<Response> {
        const reportId = createReportId(req.params.id ?? '')
        const { resolution } = req.body

        if (!resolution) {
            throw new ValidationError([
                { field: 'resolution', message: 'Resolution is required' },
            ])
        }

        const resolvedBy = createUserId(req.userId ?? 'system')
        const report = await this.reportService.resolve(reportId, resolution, resolvedBy)

        return res.status(HttpStatus.OK).json({
            data: report,
        })
    }

    /**
     * Dismiss a report
     * POST /api/v1/reports/:id/dismiss
     */
    @Log
    @Catch
    async dismiss(req: Request, res: Response, _next: NextFunction): Promise<Response> {
        const reportId = createReportId(req.params.id ?? '')
        const { reason } = req.body

        if (!reason) {
            throw new ValidationError([
                { field: 'reason', message: 'Reason is required' },
            ])
        }

        const dismissedBy = createUserId(req.userId ?? 'system')
        const report = await this.reportService.dismiss(reportId, reason, dismissedBy)

        return res.status(HttpStatus.OK).json({
            data: report,
        })
    }

    /**
     * Get report statistics
     * GET /api/v1/reports/stats
     */
    @Log
    @Catch
    async stats(_req: Request, res: Response, _next: NextFunction): Promise<Response> {
        const counts = await this.reportService.countByStatus()

        return res.status(HttpStatus.OK).json({
            data: counts,
        })
    }

    // ============================================
    // Private Helpers
    // ============================================

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
