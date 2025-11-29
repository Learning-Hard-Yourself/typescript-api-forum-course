import { assertNever, matchDiscriminated } from '@/app/shared/types/exhaustive';

export type NotificationType = 'reply' | 'vote' | 'system' | 'mention' | 'moderation'

export type NotificationPayload =
    | { type: 'reply'; threadId: string; postId: string; replyId: string }
    | { type: 'vote'; postId: string; voterId: string; voteType: 'upvote' | 'downvote' }
    | { type: 'system'; message: string; level: 'info' | 'warn' | 'error' }
    | { type: 'mention'; threadId: string; postId: string; mentionedBy: string }
    | { type: 'moderation'; action: ModerationAction; targetType: 'post' | 'thread'; targetId: string }

export type ModerationAction = 'deleted' | 'edited' | 'locked' | 'unlocked' | 'warned'

export type PayloadByType<T extends NotificationType> = Extract<NotificationPayload, { type: T }>

export interface Notification {
    id: string
    userId: string
    type: NotificationType
    data: NotificationPayload
    readAt: string | null
    createdAt: string
}

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

export function isMentionNotification(
    notification: NotificationPayload,
): notification is PayloadByType<'mention'> {
    return notification.type === 'mention'
}

export function isModerationNotification(
    notification: NotificationPayload,
): notification is PayloadByType<'moderation'> {
    return notification.type === 'moderation'
}

/**
 * Gets the notification title using exhaustive checking.
 * Compile-time error if a new notification type is added but not handled.
 */
export function getNotificationTitle(payload: NotificationPayload): string {
    switch (payload.type) {
        case 'reply':
            return 'New reply to your post'
        case 'vote':
            return payload.voteType === 'upvote' ? 'Someone upvoted your post' : 'Someone downvoted your post'
        case 'system':
            return `System ${payload.level}`
        case 'mention':
            return 'You were mentioned in a post'
        case 'moderation':
            return `Your content was ${payload.action}`
        default:
            return assertNever(payload)
    }
}

/**
 * Gets the notification URL using matchDiscriminated for exhaustive handling.
 */
export function getNotificationUrl(payload: NotificationPayload): string {
    return matchDiscriminated(payload, 'type', {
        reply: (p) => `/threads/${p.threadId}/posts/${p.replyId}`,
        vote: (p) => `/posts/${p.postId}`,
        system: () => '/notifications',
        mention: (p) => `/threads/${p.threadId}/posts/${p.postId}`,
        moderation: (p) => `/${p.targetType}s/${p.targetId}`,
    })
}

/**
 * Determines if a notification should send an email.
 * Uses exhaustive switch to ensure all types are considered.
 */
export function shouldSendEmail(payload: NotificationPayload): boolean {
    switch (payload.type) {
        case 'reply':
        case 'mention':
            return true
        case 'vote':
            return false
        case 'system':
            return payload.level === 'error'
        case 'moderation':
            return true
        default:
            return assertNever(payload)
    }
}

/**
 * Gets the notification priority for sorting/batching.
 */
export function getNotificationPriority(payload: NotificationPayload): 'high' | 'medium' | 'low' {
    switch (payload.type) {
        case 'moderation':
            return 'high'
        case 'mention':
        case 'reply':
            return 'medium'
        case 'vote':
        case 'system':
            return payload.type === 'system' && payload.level === 'error' ? 'high' : 'low'
        default:
            return assertNever(payload)
    }
}

/**
 * Groups notifications by actionable context.
 */
export function getNotificationGroup(payload: NotificationPayload): string {
    return matchDiscriminated(payload, 'type', {
        reply: (p) => `thread:${p.threadId}`,
        vote: (p) => `post:${p.postId}`,
        system: () => 'system',
        mention: (p) => `thread:${p.threadId}`,
        moderation: (p) => `moderation:${p.targetType}`,
    })
}
