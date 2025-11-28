import { eq } from 'drizzle-orm'

import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { posts } from '@/config/schema'
import type { Post } from '@/types'

export interface PostDeleterInput {
    postId: string
    deleterId: string
    reason?: string
}

/**
 * Use case for soft-deleting a post.
 */
export class PostDeleter {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: PostDeleterInput): Promise<void> {
        const { postId, deleterId } = input

        const post = await this.findPost(postId)

        if (post.isDeleted) {
            throw new Error('Post is already deleted')
        }

        await this.database
            .update(posts)
            .set({
                isDeleted: true,
                deletedAt: new Date().toISOString(),
                deletedBy: deleterId,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(posts.id, postId))
    }

    private async findPost(postId: string): Promise<Post> {
        const post = await this.database.query.posts.findFirst({
            where: eq(posts.id, postId),
        })

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        return post as Post
    }
}
