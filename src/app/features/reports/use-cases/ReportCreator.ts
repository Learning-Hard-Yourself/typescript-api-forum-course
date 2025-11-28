import { Log } from '@/app/shared/decorators'
import { DatabaseTransaction } from '@/app/shared/resources/DisposableResource'
import type { CreateReportInput, Report } from '../models/Report'
import { createReport, isHighPriority } from '../models/Report'
import { ReportStore } from './ReportStore'

/**
 * Use case for creating a new report.
 */
export class ReportCreator {
    private readonly store = ReportStore.getInstance()

    @Log
    public async execute(input: CreateReportInput): Promise<Report> {
        const transaction = new DatabaseTransaction()

        const report = createReport(input)

        await transaction.execute(`INSERT INTO reports VALUES (${report.id})`)

        if (isHighPriority(report)) {
            await transaction.execute(`INSERT INTO alerts VALUES (${report.id})`)
        }

        transaction.commit()
        transaction[Symbol.dispose]()

        this.store.set(report.id, report)
        return report
    }
}
