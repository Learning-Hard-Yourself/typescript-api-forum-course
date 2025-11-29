import type { NextFunction, Request, Response } from 'express'

import { Log } from '@/app/shared/decorators'
import { HttpStatus } from '@/app/shared/http/HttpStatus'
import type { Logger } from '@/app/shared/logging/Logger'
import { createUserId } from '@/app/shared/types/branded'
import { ReportPriority, ReportStatus, ReportType } from '../models/Report'
import type { ReportFilters, ReportLister } from '../use-cases/ReportLister'

export class IndexReportsController {
    public constructor(
        private readonly reportLister: ReportLister,
        private readonly logger?: Logger,
    ) {}

    @Log
    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
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

            this.logger?.info('Reports listed', { count: reports.length })

            res.status(HttpStatus.OK).json({ data: reports, meta: { total: reports.length } })
        } catch (error) {
            next(error)
        }
    }
}
