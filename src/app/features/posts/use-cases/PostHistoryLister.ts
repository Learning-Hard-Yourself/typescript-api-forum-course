import { desc, eq } from 'drizzle-orm'

import type { EditHistoryEntry, PostEdit } from '@/app/features/posts/models/PostModeration'
import { createEditHistoryEntry } from '@/app/features/posts/models/PostModeration'
import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { postEdits, posts } from '@/config/schema'

export interface PostHistoryListerInput {
    postId: string
}

/**
 * Use case for listing the edit history of a post.
 */
export class PostHistoryLister {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: PostHistoryListerInput): Promise<EditHistoryEntry[]> {
        const { postId } = input

        const post = await this.database.query.posts.findFirst({
            where: eq(posts.id, postId),
        })

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        const edits = await this.database
            .select()
            .from(postEdits)
            .where(eq(postEdits.postId, postId))
            .orderBy(desc(postEdits.createdAt))

        return edits.map((edit) => createEditHistoryEntry(edit as PostEdit))
    }
}
