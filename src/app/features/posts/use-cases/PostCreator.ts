import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { PostCreationAttributes } from '@/app/features/posts/requests/PostCreationRequest'
import type { ForumDatabase } from '@/config/database-types'
import { posts, threads } from '@/config/schema'
import type { Post } from '@/types'

export interface PostCreatorInput {
    authorId: string
    attributes: PostCreationAttributes
}

/**
 * Use case for creating a new post in a thread.
 */
export class PostCreator {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: PostCreatorInput): Promise<Post> {
        const { authorId, attributes } = input
        const id = uuidv7()
        const timestamp = new Date().toISOString()

        await this.database.insert(posts).values({
            id,
            threadId: attributes.threadId,
            parentPostId: attributes.parentPostId ?? null,
            authorId,
            content: attributes.content,
            voteScore: 0,
            isEdited: false,
            isDeleted: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        })

        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, attributes.threadId),
        })

        if (thread) {
            await this.database
                .update(threads)
                .set({
                    lastPostId: id,
                    replyCount: thread.replyCount + 1,
                    updatedAt: timestamp,
                })
                .where(eq(threads.id, attributes.threadId))
        }

        const [record] = await this.database.select().from(posts).where(eq(posts.id, id)).limit(1)

        if (!record) {
            throw new Error('Post could not be created')
        }

        return record as Post
    }
}
