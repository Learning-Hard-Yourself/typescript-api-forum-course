import { Log } from '@/app/shared/decorators'
import type { UserId } from '@/app/shared/types/branded'
import type { Report, ReportType } from '../models/Report'
import { ReportPriority, ReportStatus } from '../models/Report'
import { ReportStore } from './ReportStore'

export interface ReportFilters {
    status?: ReportStatus
    priority?: ReportPriority
    reportType?: ReportType
    reporterId?: UserId
}

/**
 * Use case for listing reports with optional filters.
 */
export class ReportLister {
    private readonly store = ReportStore.getInstance()

    @Log
    public async execute(filters?: ReportFilters): Promise<Report[]> {
        let reports = this.store.getAll()

        if (filters) {
            if (filters.status) {
                reports = reports.filter((r) => r.status === filters.status)
            }
            if (filters.priority) {
                reports = reports.filter((r) => r.priority === filters.priority)
            }
            if (filters.reportType) {
                reports = reports.filter((r) => r.reportType === filters.reportType)
            }
            if (filters.reporterId) {
                reports = reports.filter((r) => r.reporterId === filters.reporterId)
            }
        }

        return reports
    }

    @Log
    public async getPendingHighPriority(): Promise<Report[]> {
        return this.execute({
            status: ReportStatus.Pending,
            priority: ReportPriority.High,
        })
    }
}
