import { JsonResource } from '@/app/shared/resources/JsonResource'
import type { Thread } from '@/types'

export interface ThreadOutput {
    id: string
    title: string
    slug: string | null
    isPinned: boolean
    isLocked: boolean
    viewCount: number
    replyCount: number
    lastPostId: string | null
    createdAt: string
    updatedAt: string
    author?: Thread['author']
    category?: Thread['category']
    lastPost?: Thread['lastPost']
}

export class ThreadResource extends JsonResource<Thread, ThreadOutput> {
    toArray(): ThreadOutput {
        return {
            id: this.resource.id,
            title: this.resource.title,
            slug: this.resource.slug,
            isPinned: this.resource.isPinned,
            isLocked: this.resource.isLocked,
            viewCount: this.resource.viewCount,
            replyCount: this.resource.replyCount,
            lastPostId: this.resource.lastPostId,
            createdAt: this.resource.createdAt,
            updatedAt: this.resource.updatedAt,
            author: this.resource.author,
            category: this.resource.category,
            lastPost: this.resource.lastPost,
        }
    }
}
