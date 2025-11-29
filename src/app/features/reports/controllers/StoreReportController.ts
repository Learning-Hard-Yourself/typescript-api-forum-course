import type { NextFunction, Request, Response } from 'express'

import { Log } from '@/app/shared/decorators'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import { HttpStatus } from '@/app/shared/http/HttpStatus'
import { headers } from '@/app/shared/http/ResponseHeaders'
import type { Logger } from '@/app/shared/logging/Logger'
import { createPostId, createThreadId, createUserId } from '@/app/shared/types/branded'
import type { CreateReportInput, ReportTarget } from '../models/Report'
import { ReportPriority, ReportType } from '../models/Report'
import type { ReportCreator } from '../use-cases/ReportCreator'

export class StoreReportController {
    public constructor(
        private readonly reportCreator: ReportCreator,
        private readonly logger?: Logger,
    ) {}

    @Log
    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
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

            this.logger?.info('Report created', { reportId: report.id })

            headers(res)
                .location({ basePath: '/api/v1/reports', resourceId: report.id })

            res.status(HttpStatus.Created).json({ data: report })
        } catch (error) {
            next(error)
        }
    }

    private buildReportTarget(
        targetType: string,
        targetId: string,
        body: Record<string, unknown>,
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
