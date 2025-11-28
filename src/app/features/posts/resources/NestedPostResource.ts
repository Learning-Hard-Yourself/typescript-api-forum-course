import type { PostWithReplies } from '@/app/features/posts/models/PostTree'
import { JsonResource, jsonCollection } from '@/app/shared/resources/JsonResource'

export interface NestedPostOutput {
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
    depth: string
    replies: NestedPostOutput[]
}

export class NestedPostResource extends JsonResource<PostWithReplies, NestedPostOutput> {
    toArray(): NestedPostOutput {
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
            depth: String(this.resource.depth ?? 'level-0'),
            replies: this.resource.replies?.map((reply) => new NestedPostResource(reply).toArray()) ?? [],
        }
    }

    static fromArray(posts: PostWithReplies[]) {
        return jsonCollection(posts.map((post) => new NestedPostResource(post).toArray()))
    }
}
