import type { PostWithReplies } from '@/app/features/posts/models/PostTree'

export class NestedPostResource {

    public toJson(post: PostWithReplies): Record<string, unknown> {
        return {
            id: post.id,
            threadId: post.threadId,
            parentPostId: post.parentPostId,
            authorId: post.authorId,
            content: post.content,
            voteScore: post.voteScore,
            isEdited: post.isEdited,
            isDeleted: post.isDeleted,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            depth: post.depth,

            replies: post.replies?.map((reply) => this.toJson(reply)) ?? [],
        }
    }


    public toJsonArray(posts: PostWithReplies[]): Record<string, unknown>[] {
        return posts.map((post) => this.toJson(post))
    }
}
