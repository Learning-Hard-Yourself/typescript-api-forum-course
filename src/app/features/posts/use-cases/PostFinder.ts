import { eq } from 'drizzle-orm'

import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ForumDatabase } from '@/config/database-types'
import { posts } from '@/config/schema'
import type { Post } from '@/types'

export interface PostFinderInput {
    id: string
}

/**
 * Use case for finding a post by ID.
 */
export class PostFinder {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: PostFinderInput): Promise<Post> {
        const [post] = await this.database
            .select()
            .from(posts)
            .where(eq(posts.id, input.id))
            .limit(1)

        if (!post) {
            throw new NotFoundError(`Post with ID ${input.id} not found`)
        }

        return post as Post
    }
}
