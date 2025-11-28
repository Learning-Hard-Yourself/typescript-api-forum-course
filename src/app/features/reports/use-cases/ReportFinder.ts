import { Log } from '@/app/shared/decorators'
import type { ReportId } from '@/app/shared/types/branded'
import type { Report } from '../models/Report'
import { ReportStore } from './ReportStore'

export interface ReportFinderInput {
    id: ReportId
}

export class ReportFinder {
    private readonly store = ReportStore.getInstance()

    @Log
    public async execute(input: ReportFinderInput): Promise<Report | null> {
        return this.store.get(input.id) ?? null
    }
}
