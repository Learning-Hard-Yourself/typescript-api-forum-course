import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { ThreadCreationAttributes } from '@/app/features/threads/requests/ThreadCreationRequest'
import type { ForumDatabase } from '@/config/database-types'
import { posts, threads } from '@/config/schema'
import type { Thread } from '@/types'

export interface ThreadCreatorInput {
    authorId: string
    attributes: ThreadCreationAttributes
}

/**
 * Use case for creating a new thread with its initial post.
 */
export class ThreadCreator {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: ThreadCreatorInput): Promise<Thread> {
        const { authorId, attributes } = input
        const threadId = uuidv7()
        const postId = uuidv7()
        const timestamp = new Date().toISOString()

        this.database.transaction((tx: any) => {
            tx.insert(threads).values({
                id: threadId,
                categoryId: attributes.categoryId,
                authorId,
                title: attributes.title,
                slug: attributes.slug ?? this.generateSlug(attributes.title),
                isPinned: false,
                isLocked: false,
                viewCount: 0,
                replyCount: 0,
                lastPostId: null,
                createdAt: timestamp,
                updatedAt: timestamp,
            }).run()

            tx.insert(posts).values({
                id: postId,
                threadId,
                parentPostId: null,
                authorId,
                content: attributes.content,
                voteScore: 0,
                isEdited: false,
                isDeleted: false,
                createdAt: timestamp,
                updatedAt: timestamp,
            }).run()

            tx.update(threads).set({ lastPostId: postId }).where(eq(threads.id, threadId)).run()
        })

        const [record] = await this.database
            .select()
            .from(threads)
            .where(eq(threads.id, threadId))
            .limit(1)

        if (!record) {
            throw new Error('Thread could not be created')
        }

        return record as Thread
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }
}
