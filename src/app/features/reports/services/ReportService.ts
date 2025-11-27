/**
 * Report Service - Uses disposable resources for transactions.
 * 
 * Concepts used:
 * - using declarations with DatabaseTransaction
 * - Branded types for IDs
 * - enum for status transitions
 * - Utility types (NonNullable, Awaited)
 */

import { Log } from '@/app/shared/decorators'
import {
    DatabaseTransaction,
    ResourceLock
} from '@/app/shared/resources/DisposableResource'
import type { ReportId, UserId } from '@/app/shared/types/branded'
import type { ForumDatabase } from '@/config/database-types'
import type {
    CreateReportInput,
    Report,
    ReportType,
} from '../models/Report'
import {
    ReportPriority,
    ReportStatus,
    createReport,
    isHighPriority,
} from '../models/Report'

// ============================================
// Types
// ============================================

export interface ReportFilters {
    status?: ReportStatus
    priority?: ReportPriority
    reportType?: ReportType
    reporterId?: UserId
}

export interface ReportUpdateInput {
    status?: ReportStatus
    priority?: ReportPriority
    resolution?: string
}

// Using Awaited and ReturnType for derived types
type ReportServiceMethods = ReportService
type FindByIdResult = Awaited<ReturnType<ReportServiceMethods['findById']>>
type NonNullableReport = NonNullable<FindByIdResult>

// ============================================
// Service Class
// ============================================

export class ReportService {
    private readonly reports: Map<string, Report> = new Map()

    constructor(private readonly _database: ForumDatabase) {}

    /**
     * Create a new report using a transaction
     */
    @Log
    async create(input: CreateReportInput): Promise<Report> {
        // Using disposable transaction
        const transaction = new DatabaseTransaction()
        
        const report = createReport(input)
        
        await transaction.execute(`INSERT INTO reports VALUES (${report.id})`)
        
        // If high priority, create an alert
        if (isHighPriority(report)) {
            await transaction.execute(`INSERT INTO alerts VALUES (${report.id})`)
        }
        
        transaction.commit()
        transaction[Symbol.dispose]()
        
        this.reports.set(report.id, report)
        return report
    }

    /**
     * Find a report by ID
     */
    @Log
    async findById(id: ReportId): Promise<Report | null> {
        return this.reports.get(id) ?? null
    }

    /**
     * Find all reports with optional filters
     */
    @Log
    async findAll(filters?: ReportFilters): Promise<Report[]> {
        let reports = Array.from(this.reports.values())

        if (filters) {
            if (filters.status) {
                reports = reports.filter(r => r.status === filters.status)
            }
            if (filters.priority) {
                reports = reports.filter(r => r.priority === filters.priority)
            }
            if (filters.reportType) {
                reports = reports.filter(r => r.reportType === filters.reportType)
            }
            if (filters.reporterId) {
                reports = reports.filter(r => r.reporterId === filters.reporterId)
            }
        }

        return reports
    }

    /**
     * Update a report with exclusive lock
     */
    @Log
    async update(id: ReportId, input: ReportUpdateInput, updatedBy: UserId): Promise<Report> {
        // Acquire exclusive lock on the report
        const lock = ResourceLock.acquire(`report_${id}`)
        
        try {
            const report = await this.findById(id)
            if (!report) {
                throw new Error(`Report ${id} not found`)
            }

            const now = new Date().toISOString()
            const updated: Report = {
                ...report,
                status: input.status ?? report.status,
                priority: input.priority ?? report.priority,
                resolution: input.resolution ?? report.resolution,
                updatedAt: now,
                resolvedAt: input.status === ReportStatus.Resolved ? now : report.resolvedAt,
                resolvedBy: input.status === ReportStatus.Resolved ? updatedBy : report.resolvedBy,
            }

            this.reports.set(id, updated)
            return updated
        } finally {
            lock[Symbol.dispose]()
        }
    }

    /**
     * Resolve a report
     */
    @Log
    async resolve(id: ReportId, resolution: string, resolvedBy: UserId): Promise<Report> {
        return this.update(id, {
            status: ReportStatus.Resolved,
            resolution,
        }, resolvedBy)
    }

    /**
     * Dismiss a report
     */
    @Log
    async dismiss(id: ReportId, reason: string, dismissedBy: UserId): Promise<Report> {
        return this.update(id, {
            status: ReportStatus.Dismissed,
            resolution: reason,
        }, dismissedBy)
    }

    /**
     * Get pending high-priority reports
     */
    @Log
    async getPendingHighPriority(): Promise<Report[]> {
        return this.findAll({
            status: ReportStatus.Pending,
            priority: ReportPriority.High,
        })
    }

    /**
     * Count reports by status
     */
    async countByStatus(): Promise<Record<ReportStatus, number>> {
        const counts = {
            [ReportStatus.Pending]: 0,
            [ReportStatus.UnderReview]: 0,
            [ReportStatus.Resolved]: 0,
            [ReportStatus.Dismissed]: 0,
        }

        for (const report of this.reports.values()) {
            counts[report.status]++
        }

        return counts
    }
}

// Export derived types for use elsewhere
export type { FindByIdResult, NonNullableReport }

