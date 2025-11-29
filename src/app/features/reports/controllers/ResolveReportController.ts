import type { NextFunction, Request, Response } from 'express'

import { Log } from '@/app/shared/decorators'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import { HttpStatus } from '@/app/shared/http/HttpStatus'
import type { Logger } from '@/app/shared/logging/Logger'
import { createReportId, createUserId } from '@/app/shared/types/branded'
import type { ReportResolver } from '../use-cases/ReportResolver'

export class ResolveReportController {
    public constructor(
        private readonly reportResolver: ReportResolver,
        private readonly logger?: Logger,
    ) {}

    @Log
    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
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

            this.logger?.info('Report resolved', { reportId: report.id })

            res.status(HttpStatus.OK).json({ data: report })
        } catch (error) {
            next(error)
        }
    }
}
