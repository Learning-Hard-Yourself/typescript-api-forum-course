import { Log } from '@/app/shared/decorators'
import type { ReportId, UserId } from '@/app/shared/types/branded'
import type { Report } from '../models/Report'
import { ReportStatus } from '../models/Report'
import { ReportUpdater } from './ReportUpdater'

export interface ReportResolverInput {
    id: ReportId
    resolution: string
    resolvedBy: UserId
}

export class ReportResolver {
    private readonly updater = new ReportUpdater()

    @Log
    public async execute(input: ReportResolverInput): Promise<Report> {
        return this.updater.execute({
            id: input.id,
            update: {
                status: ReportStatus.Resolved,
                resolution: input.resolution,
            },
            updatedBy: input.resolvedBy,
        })
    }
}
