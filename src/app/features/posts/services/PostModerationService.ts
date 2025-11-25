import { desc, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type {
    EditHistoryEntry,
    PostEdit,
    PostWithHistory,
} from '@/app/features/posts/models/PostModeration'
import { createEditHistoryEntry } from '@/app/features/posts/models/PostModeration'
import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { postEdits, posts } from '@/config/schema'
import type { Post } from '@/types'

export class PostModerationService {
    constructor(private readonly database: ForumDatabase) { }


    async editPost(
        postId: string,
        editorId: string,
        newContent: string,
        reason?: string,
    ): Promise<Post> {

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


    async deletePost(postId: string, deleterId: string, reason?: string): Promise<void> {
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


    async restorePost(postId: string, restorerId: string): Promise<Post> {
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


    async getEditHistory(postId: string): Promise<EditHistoryEntry[]> {

        await this.findPost(postId)

        const edits = await this.database
            .select()
            .from(postEdits)
            .where(eq(postEdits.postId, postId))
            .orderBy(desc(postEdits.createdAt))

        return edits.map((edit) => createEditHistoryEntry(edit as PostEdit))
    }


    async getPostWithHistory(postId: string): Promise<PostWithHistory> {
        const post = await this.findPost(postId)
        const history = await this.getEditHistory(postId)

        return {
            ...post,
            editHistory: history,
            editCount: history.length,
        }
    }


    async canEdit(postId: string, userId: string): Promise<boolean> {
        const post = await this.findPost(postId)

        if (post.isDeleted) {
            return false
        }

        return post.authorId === userId
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
