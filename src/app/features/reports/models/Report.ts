import type { PostId, ReportId, ThreadId, UserId } from '@/app/shared/types/branded';
import { createReportId } from '@/app/shared/types/branded';

export enum ReportType {
    Spam = 'SPAM',
    Harassment = 'HARASSMENT',
    Inappropriate = 'INAPPROPRIATE',
    Copyright = 'COPYRIGHT',
    Other = 'OTHER',
}

export enum ReportStatus {
    Pending = 'PENDING',
    UnderReview = 'UNDER_REVIEW',
    Resolved = 'RESOLVED',
    Dismissed = 'DISMISSED',
}

export enum ReportPriority {
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

export type ReportTarget =
    | { type: 'post'; postId: PostId; threadId: ThreadId }
    | { type: 'thread'; threadId: ThreadId }
    | { type: 'user'; userId: UserId }
    | { type: 'comment'; commentId: string; postId: PostId }

export interface Report {
    readonly id: ReportId
    readonly reporterId: UserId
    readonly target: ReportTarget
    readonly reportType: ReportType
    readonly status: ReportStatus
    readonly priority: ReportPriority
    readonly description: string
    readonly createdAt: string
    readonly updatedAt: string
    readonly resolvedAt: string | null
    readonly resolvedBy: UserId | null
    readonly resolution: string | null
}

export interface CreateReportInput {
    readonly reporterId: UserId
    readonly target: ReportTarget
    readonly reportType: ReportType
    readonly description: string
    readonly priority?: ReportPriority
}

type ReportPrefix = 'RPT'
type Year = `${number}${number}${number}${number}`
type Month = `${number}${number}`

export type ReportReference = `${ReportPrefix}-${Year}-${Month}-${string}`

export function generateReportReference(): ReportReference {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `RPT-${year}-${month}-${random}` as ReportReference
}

export function isPostReport(target: ReportTarget): target is Extract<ReportTarget, { type: 'post' }> {
    return target.type === 'post'
}

export function isThreadReport(target: ReportTarget): target is Extract<ReportTarget, { type: 'thread' }> {
    return target.type === 'thread'
}

export function isUserReport(target: ReportTarget): target is Extract<ReportTarget, { type: 'user' }> {
    return target.type === 'user'
}

export function isHighPriority(report: Report): boolean {
    return report.priority >= ReportPriority.High
}

export function isPending(report: Report): boolean {
    return report.status === ReportStatus.Pending
}

export function createReport(input: CreateReportInput): Report {
    const now = new Date().toISOString()
    
    return {
        id: createReportId(`rpt_${Date.now()}`),
        reporterId: input.reporterId,
        target: input.target,
        reportType: input.reportType,
        status: ReportStatus.Pending,
        priority: input.priority ?? ReportPriority.Medium,
        description: input.description,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        resolvedBy: null,
        resolution: null,
    }
}
