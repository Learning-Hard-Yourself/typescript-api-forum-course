import { Log } from '@/app/shared/decorators'
import { ResourceLock } from '@/app/shared/resources/DisposableResource'
import type { ReportId, UserId } from '@/app/shared/types/branded'
import type { Report } from '../models/Report'
import { ReportPriority, ReportStatus } from '../models/Report'
import { ReportStore } from './ReportStore'

export interface ReportUpdateInput {
    status?: ReportStatus
    priority?: ReportPriority
    resolution?: string
}

export interface ReportUpdaterInput {
    id: ReportId
    update: ReportUpdateInput
    updatedBy: UserId
}

export class ReportUpdater {
    private readonly store = ReportStore.getInstance()

    @Log
    public async execute(input: ReportUpdaterInput): Promise<Report> {
        const { id, update, updatedBy } = input
        const lock = ResourceLock.acquire(`report_${id}`)

        try {
            const report = this.store.get(id)
            if (!report) {
                throw new Error(`Report ${id} not found`)
            }

            const now = new Date().toISOString()
            const updated: Report = {
                ...report,
                status: update.status ?? report.status,
                priority: update.priority ?? report.priority,
                resolution: update.resolution ?? report.resolution,
                updatedAt: now,
                resolvedAt: update.status === ReportStatus.Resolved ? now : report.resolvedAt,
                resolvedBy: update.status === ReportStatus.Resolved ? updatedBy : report.resolvedBy,
            }

            this.store.set(id, updated)
            return updated
        } finally {
            lock[Symbol.dispose]()
        }
    }
}
