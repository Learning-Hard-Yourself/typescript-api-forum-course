import type { PostWithReplies } from '@/app/features/posts/models/PostTree'

/**
 * Nested Post Resource - Transform post trees for API responses
 *
 * Demonstrates: Recursive transformations
 */
export class NestedPostResource {
    /**
     * Transform a post with nested replies
     * Recursively processes all reply levels
     */
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
            // Recursively transform replies
            replies: post.replies?.map((reply) => this.toJson(reply)) ?? [],
        }
    }

    /**
     * Transform array of posts with nested structure
     */
    public toJsonArray(posts: PostWithReplies[]): Record<string, unknown>[] {
        return posts.map((post) => this.toJson(post))
    }
}
