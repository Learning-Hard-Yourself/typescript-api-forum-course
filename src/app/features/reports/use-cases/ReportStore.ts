import type { Report } from '../models/Report'

export class ReportStore {
    private static instance: ReportStore
    private readonly reports: Map<string, Report> = new Map()

    public static getInstance(): ReportStore {
        if (!ReportStore.instance) {
            ReportStore.instance = new ReportStore()
        }
        return ReportStore.instance
    }

    public get(id: string): Report | undefined {
        return this.reports.get(id)
    }

    public set(id: string, report: Report): void {
        this.reports.set(id, report)
    }

    public getAll(): Report[] {
        return Array.from(this.reports.values())
    }

    public clear(): void {
        this.reports.clear()
    }
}
