import type { NextFunction, Request, Response } from 'express'

import { Log } from '@/app/shared/decorators'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import { HttpStatus } from '@/app/shared/http/HttpStatus'
import type { Logger } from '@/app/shared/logging/Logger'
import { createReportId } from '@/app/shared/types/branded'
import type { ReportFinder } from '../use-cases/ReportFinder'

export class ShowReportController {
    public constructor(
        private readonly reportFinder: ReportFinder,
        private readonly logger?: Logger,
    ) {}

    @Log
    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
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
}
