/**
 * Notification Types
 *
 * Demonstrates:
 * - Discriminated Unions for type-safe payloads
 * - Mapped Types for relationship between type and payload
 * - Type Guards for runtime validation
 */

export type NotificationType = 'reply' | 'vote' | 'system'

/**
 * Discriminated Union for notification payloads
 *
 * Learning: Each member has a common 'type' property (discriminant)
 * that TypeScript uses to narrow down the specific shape.
 */
export type NotificationPayload =
    | { type: 'reply'; threadId: string; postId: string; replyId: string }
    | { type: 'vote'; postId: string; voterId: string; voteType: 'upvote' | 'downvote' }
    | { type: 'system'; message: string; level: 'info' | 'warn' | 'error' }

/**
 * Mapped Type helper to extract payload by type
 *
 * Learning: Uses Extract utility type to filter the union
 */
export type PayloadByType<T extends NotificationType> = Extract<NotificationPayload, { type: T }>

/**
 * Notification model matching database structure
 */
export interface Notification {
    id: string
    userId: string
    type: NotificationType
    data: NotificationPayload
    readAt: string | null
    createdAt: string
}

// ================================
// TYPE GUARDS
// ================================

export function isReplyNotification(
    notification: NotificationPayload,
): notification is PayloadByType<'reply'> {
    return notification.type === 'reply'
}

export function isVoteNotification(
    notification: NotificationPayload,
): notification is PayloadByType<'vote'> {
    return notification.type === 'vote'
}

export function isSystemNotification(
    notification: NotificationPayload,
): notification is PayloadByType<'system'> {
    return notification.type === 'system'
}
