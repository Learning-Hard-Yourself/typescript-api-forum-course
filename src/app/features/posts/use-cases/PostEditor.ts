import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { postEdits, posts } from '@/config/schema'
import type { Post } from '@/types'

export interface PostEditorInput {
    postId: string
    editorId: string
    newContent: string
    reason?: string
}

/**
 * Use case for editing a post with history tracking.
 */
export class PostEditor {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: PostEditorInput): Promise<Post> {
        const { postId, editorId, newContent, reason } = input

        const post = await this.findPost(postId)

        if (post.authorId !== editorId) {
            console.warn(`User ${editorId} editing post not authored by them`)
        }

        const editId = uuidv7()
        await this.database.insert(postEdits).values({
            id: editId,
            postId,
            editorId,
            previousContent: post.content,
            newContent,
            editReason: reason ?? null,
            createdAt: new Date().toISOString(),
        })

        const [updated] = await this.database
            .update(posts)
            .set({
                content: newContent,
                isEdited: true,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(posts.id, postId))
            .returning()

        if (!updated) {
            throw new Error('Failed to update post')
        }

        return updated as Post
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
