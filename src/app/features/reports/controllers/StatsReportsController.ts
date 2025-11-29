import type { NextFunction, Request, Response } from 'express'

import { Log } from '@/app/shared/decorators'
import { HttpStatus } from '@/app/shared/http/HttpStatus'
import type { Logger } from '@/app/shared/logging/Logger'
import type { ReportStatsRetriever } from '../use-cases/ReportStatsRetriever'

export class StatsReportsController {
    public constructor(
        private readonly reportStatsRetriever: ReportStatsRetriever,
        private readonly logger?: Logger,
    ) {}

    @Log
    public async handle(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const counts = await this.reportStatsRetriever.execute()

            res.status(HttpStatus.OK).json({ data: counts })
        } catch (error) {
            next(error)
        }
    }
}
