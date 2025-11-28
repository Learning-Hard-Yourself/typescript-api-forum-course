import { JsonResource } from '@/app/shared/resources/JsonResource'
import type { Thread } from '@/types'

export interface ThreadOutput {
    id: string
    categoryId: string
    authorId: string
    title: string
    slug: string | null
    isPinned: boolean
    isLocked: boolean
    viewCount: number
    replyCount: number
    createdAt: string
    updatedAt: string
}

export class ThreadResource extends JsonResource<Thread, ThreadOutput> {
    toArray(): ThreadOutput {
        return {
            id: this.resource.id,
            categoryId: this.resource.categoryId,
            authorId: this.resource.authorId,
            title: this.resource.title,
            slug: this.resource.slug,
            isPinned: this.resource.isPinned,
            isLocked: this.resource.isLocked,
            viewCount: this.resource.viewCount,
            replyCount: this.resource.replyCount,
            createdAt: this.resource.createdAt,
            updatedAt: this.resource.updatedAt,
        }
    }
}
