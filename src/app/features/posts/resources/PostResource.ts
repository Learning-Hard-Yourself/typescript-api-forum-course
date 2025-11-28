import { JsonResource } from '@/app/shared/resources/JsonResource'
import type { Post } from '@/types'

export interface PostOutput {
    id: string
    threadId: string
    parentPostId: string | null
    authorId: string
    content: string
    voteScore: number
    isEdited: boolean
    isDeleted: boolean
    createdAt: string
    updatedAt: string
}

export class PostResource extends JsonResource<Post, PostOutput> {
    toArray(): PostOutput {
        return {
            id: this.resource.id,
            threadId: this.resource.threadId,
            parentPostId: this.resource.parentPostId,
            authorId: this.resource.authorId,
            content: this.resource.content,
            voteScore: this.resource.voteScore,
            isEdited: this.resource.isEdited,
            isDeleted: this.resource.isDeleted,
            createdAt: this.resource.createdAt,
            updatedAt: this.resource.updatedAt,
        }
    }
}
