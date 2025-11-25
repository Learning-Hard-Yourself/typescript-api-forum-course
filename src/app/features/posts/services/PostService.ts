import { eq, sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { PostCreationAttributes } from '@/app/features/posts/requests/PostCreationRequest'
import { posts, threads } from '@/config/schema'
import type { ForumDatabase } from '@/config/database-types'
import type { Post } from '@/types'

export class PostService {
    public constructor(private readonly database: ForumDatabase) { }

    public async create(authorId: string, attributes: PostCreationAttributes): Promise<Post> {
        const id = uuidv7()
        const timestamp = new Date().toISOString()

        // Transaction to ensure post creation and thread update happen together
        this.database.transaction((tx: any) => {
            // 1. Create Post
            tx.insert(posts).values({
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
            }).run()

            // 2. Update Thread stats
            tx
                .update(threads)
                .set({
                    lastPostId: id,
                    replyCount: sql`${threads.replyCount} + 1`,
                    updatedAt: timestamp,
                })
                .where(eq(threads.id, attributes.threadId))
                .run()
        })

        const [record] = await this.database
            .select()
            .from(posts)
            .where(eq(posts.id, id))
            .limit(1)

        if (!record) {
            throw new Error('Post could not be created')
        }

        return record as Post
    }
}
