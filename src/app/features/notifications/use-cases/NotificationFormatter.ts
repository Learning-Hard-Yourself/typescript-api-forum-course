import type { NotificationPayload } from '@/app/features/notifications/models/NotificationTypes'

export class NotificationFormatter {
    public execute(notification: NotificationPayload): string {
        switch (notification.type) {
            case 'reply':
                return `New reply to your post in thread ${notification.threadId}`
            case 'vote':
                return `New ${notification.voteType} on your post`
            case 'system':
                return `System Alert: ${notification.message}`
            default: {
                const _exhaustive: never = notification
                void _exhaustive
                return 'Unknown notification'
            }
        }
    }
}
