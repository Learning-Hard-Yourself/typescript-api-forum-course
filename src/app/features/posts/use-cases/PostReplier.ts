import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import { MAX_DEPTH } from '@/app/features/posts/models/PostTree'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ForumDatabase } from '@/config/database-types'
import { posts, threads } from '@/config/schema'
import type { Post } from '@/types'

export interface PostReplierInput {
    authorId: string
    parentPostId: string
    content: string
}

/**
 * Use case for replying to a post.
 */
export class PostReplier {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: PostReplierInput): Promise<Post> {
        const { authorId, parentPostId, content } = input

        const parentPost = await this.database.query.posts.findFirst({
            where: eq(posts.id, parentPostId),
        })

        if (!parentPost) {
            throw new NotFoundError(`Post with ID ${parentPostId} not found`)
        }

        const depth = await this.getPostDepth(parentPostId)
        if (depth >= MAX_DEPTH) {
            throw new Error(`Maximum reply depth (${MAX_DEPTH}) reached`)
        }

        const id = uuidv7()
        const timestamp = new Date().toISOString()

        await this.database.insert(posts).values({
            id,
            threadId: parentPost.threadId,
            authorId,
            parentPostId,
            content,
            voteScore: 0,
            isEdited: false,
            isDeleted: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        })

        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, parentPost.threadId),
        })

        if (thread) {
            await this.database
                .update(threads)
                .set({
                    replyCount: thread.replyCount + 1,
                    lastPostId: id,
                    updatedAt: timestamp,
                })
                .where(eq(threads.id, parentPost.threadId))
        }

        const [record] = await this.database.select().from(posts).where(eq(posts.id, id)).limit(1)

        if (!record) {
            throw new Error('Reply could not be created')
        }

        return record as Post
    }

    private async getPostDepth(postId: string): Promise<number> {
        let depth = 0
        let currentPostId: string | null = postId

        while (currentPostId && depth < MAX_DEPTH + 1) {
            const post = await this.database.query.posts.findFirst({
                where: eq(posts.id, currentPostId),
            })

            if (!post || post.parentPostId === null) {
                break
            }

            depth++
            currentPostId = post.parentPostId
        }

        return depth
    }
}
