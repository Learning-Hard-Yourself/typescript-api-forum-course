import type { NotificationPayload } from '@/app/features/notifications/models/NotificationTypes'
import { assertNever } from '@/app/shared/types/exhaustive'

export class NotificationFormatter {
    public execute(notification: NotificationPayload): string {
        switch (notification.type) {
            case 'reply':
                return `New reply to your post in thread ${notification.threadId}`
            case 'vote':
                return `New ${notification.voteType} on your post`
            case 'system':
                return `System Alert: ${notification.message}`
            case 'mention':
                return `${notification.mentionedBy} mentioned you in a post`
            case 'moderation':
                return `Your ${notification.targetType} was ${notification.action}`
            default:
                return assertNever(notification)
        }
    }
}
