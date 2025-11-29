import type { PostId, ReportId, ThreadId, UserId } from '@/app/shared/types/branded';
import { createReportId } from '@/app/shared/types/branded';
import { assertNever, matchDiscriminated } from '@/app/shared/types/exhaustive';

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

/**
 * Gets the primary entity ID from a report target using exhaustive checking.
 * Compile-time error if a new target type is added but not handled.
 */
export function getTargetEntityId(target: ReportTarget): string {
    switch (target.type) {
        case 'post':
            return target.postId
        case 'thread':
            return target.threadId
        case 'user':
            return target.userId
        case 'comment':
            return target.commentId
        default:
            return assertNever(target)
    }
}

/**
 * Gets the moderation queue name for a report target.
 * Uses matchDiscriminated for type-safe exhaustive handling.
 */
export function getTargetModerationQueue(target: ReportTarget): string {
    return matchDiscriminated(target, 'type', {
        post: (t) => `posts:${t.threadId}`,
        thread: (t) => `threads:${t.threadId}`,
        user: (t) => `users:${t.userId}`,
        comment: (t) => `comments:${t.postId}`,
    })
}

/**
 * Determines if a report target requires content review vs user review.
 * Exhaustive switch ensures all target types are classified.
 */
export function isContentReport(target: ReportTarget): boolean {
    switch (target.type) {
        case 'post':
        case 'thread':
        case 'comment':
            return true
        case 'user':
            return false
        default:
            return assertNever(target)
    }
}

/**
 * Gets notification recipients for a report based on target type.
 * Exhaustive handling ensures proper escalation for all target types.
 */
export function getReportNotificationContext(target: ReportTarget): {
    entityType: string
    entityId: string
    requiresImmediateReview: boolean
} {
    switch (target.type) {
        case 'post':
            return {
                entityType: 'post',
                entityId: target.postId,
                requiresImmediateReview: false,
            }
        case 'thread':
            return {
                entityType: 'thread',
                entityId: target.threadId,
                requiresImmediateReview: false,
            }
        case 'user':
            return {
                entityType: 'user',
                entityId: target.userId,
                requiresImmediateReview: true,
            }
        case 'comment':
            return {
                entityType: 'comment',
                entityId: target.commentId,
                requiresImmediateReview: false,
            }
        default:
            return assertNever(target)
    }
}
