import { eq } from 'drizzle-orm'

import type { PostWithReplies } from '@/app/features/posts/models/PostTree'
import { buildPostTree } from '@/app/features/posts/models/PostTree'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ForumDatabase } from '@/config/database-types'
import { posts, threads } from '@/config/schema'
import type { Post } from '@/types'

export interface ThreadPostsListerInput {
    threadId: string
}

/**
 * Use case for listing all posts in a thread as a tree.
 */
export class ThreadPostsLister {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: ThreadPostsListerInput): Promise<PostWithReplies[]> {
        const { threadId } = input

        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        const allPosts = await this.database.query.posts.findMany({
            where: eq(posts.threadId, threadId),
            orderBy: (posts, { asc }) => [asc(posts.createdAt)],
        })

        const postsAsPost: Post[] = allPosts as Post[]
        return buildPostTree(postsAsPost)
    }
}
