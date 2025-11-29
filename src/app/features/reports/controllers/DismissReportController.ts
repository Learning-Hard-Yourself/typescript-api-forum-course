import type { NextFunction, Request, Response } from 'express'

import { Log } from '@/app/shared/decorators'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import { HttpStatus } from '@/app/shared/http/HttpStatus'
import type { Logger } from '@/app/shared/logging/Logger'
import { createReportId, createUserId } from '@/app/shared/types/branded'
import type { ReportDismisser } from '../use-cases/ReportDismisser'

export class DismissReportController {
    public constructor(
        private readonly reportDismisser: ReportDismisser,
        private readonly logger?: Logger,
    ) {}

    @Log
    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
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

            this.logger?.info('Report dismissed', { reportId: report.id })

            res.status(HttpStatus.OK).json({ data: report })
        } catch (error) {
            next(error)
        }
    }
}
