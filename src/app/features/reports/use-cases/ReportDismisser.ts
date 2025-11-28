import { Log } from '@/app/shared/decorators'
import type { ReportId, UserId } from '@/app/shared/types/branded'
import type { Report } from '../models/Report'
import { ReportStatus } from '../models/Report'
import { ReportUpdater } from './ReportUpdater'

export interface ReportDismisserInput {
    id: ReportId
    reason: string
    dismissedBy: UserId
}

export class ReportDismisser {
    private readonly updater = new ReportUpdater()

    @Log
    public async execute(input: ReportDismisserInput): Promise<Report> {
        return this.updater.execute({
            id: input.id,
            update: {
                status: ReportStatus.Dismissed,
                resolution: input.reason,
            },
            updatedBy: input.dismissedBy,
        })
    }
}
