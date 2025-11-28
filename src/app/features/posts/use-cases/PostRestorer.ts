import { eq } from 'drizzle-orm'

import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { posts } from '@/config/schema'
import type { Post } from '@/types'

export interface PostRestorerInput {
    postId: string
    restorerId: string
}

/**
 * Use case for restoring a soft-deleted post.
 */
export class PostRestorer {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: PostRestorerInput): Promise<Post> {
        const { postId } = input

        const post = await this.findPost(postId)

        if (!post.isDeleted) {
            throw new Error('Post is not deleted')
        }

        const [restored] = await this.database
            .update(posts)
            .set({
                isDeleted: false,
                deletedAt: null,
                deletedBy: null,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(posts.id, postId))
            .returning()

        if (!restored) {
            throw new Error('Failed to restore post')
        }

        return restored as Post
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
