

export type NotificationType = 'reply' | 'vote' | 'system'

export type NotificationPayload =
    | { type: 'reply'; threadId: string; postId: string; replyId: string }
    | { type: 'vote'; postId: string; voterId: string; voteType: 'upvote' | 'downvote' }
    | { type: 'system'; message: string; level: 'info' | 'warn' | 'error' }

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
