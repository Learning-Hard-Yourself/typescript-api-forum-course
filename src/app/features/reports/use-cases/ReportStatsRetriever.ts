import { ReportStatus } from '../models/Report'
import { ReportStore } from './ReportStore'

export class ReportStatsRetriever {
    private readonly store = ReportStore.getInstance()

    public async execute(): Promise<Record<ReportStatus, number>> {
        const counts = {
            [ReportStatus.Pending]: 0,
            [ReportStatus.UnderReview]: 0,
            [ReportStatus.Resolved]: 0,
            [ReportStatus.Dismissed]: 0,
        }

        for (const report of this.store.getAll()) {
            counts[report.status]++
        }

        return counts
    }
}
