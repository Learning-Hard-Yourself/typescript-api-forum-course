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

/**
 * Post Moderation Service
 *
 * Handles editing, soft deletion, and restoration of posts
 * with full audit trail via edit history
 */
export class PostModerationService {
    constructor(private readonly database: ForumDatabase) { }

    /**
     * Edit post with history tracking
     *
     * @param postId - ID of post to edit
     * @param editorId - ID of user making the edit
     * @param newContent - New content for the post
     * @param reason - Optional reason for the edit
     * @returns Updated post
     */
    async editPost(
        postId: string,
        editorId: string,
        newContent: string,
        reason?: string,
    ): Promise<Post> {
        // Get current post
        const post = await this.findPost(postId)

        // Check if editor is author (basic permission check)
        // In real app, would check if editor is author OR moderator
        if (post.authorId !== editorId) {
            // For now, allow edits (would add proper permission check)
            console.warn(`User ${editorId} editing post not authored by them`)
        }

        // Save edit history entry
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

        // Update post
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

    /**
     * Soft delete a post
     *
     * @param postId - ID of post to delete
     * @param deleterId - ID of user deleting the post
     * @param reason - Optional reason for deletion
     */
    async deletePost(postId: string, deleterId: string, reason?: string): Promise<void> {
        const post = await this.findPost(postId)

        // Check if already deleted
        if (post.isDeleted) {
            throw new Error('Post is already deleted')
        }

        // Soft delete: set flags but keep data
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

    /**
     * Restore a soft-deleted post
     *
     * @param postId - ID of post to restore
     * @param restorerId - ID of user restoring the post
     * @returns Restored post
     */
    async restorePost(postId: string, restorerId: string): Promise<Post> {
        const post = await this.findPost(postId)

        // Check if post is deleted
        if (!post.isDeleted) {
            throw new Error('Post is not deleted')
        }

        // Restore post
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

    /**
     * Get edit history for a post as tuple array
     *
     * Demonstrates: Converting database records to tuple format
     *
     * @param postId - ID of post
     * @returns Array of edit history entries (tuples)
     */
    async getEditHistory(postId: string): Promise<EditHistoryEntry[]> {
        // Verify post exists
        await this.findPost(postId)

        // Get all edits for this post
        const edits = await this.database
            .select()
            .from(postEdits)
            .where(eq(postEdits.postId, postId))
            .orderBy(desc(postEdits.createdAt))

        // Transform to tuple format using helper function
        return edits.map((edit) => createEditHistoryEntry(edit as PostEdit))
    }

    /**
     * Get post with full edit history
     *
     * @param postId - ID of post
     * @returns Post with edit history
     */
    async getPostWithHistory(postId: string): Promise<PostWithHistory> {
        const post = await this.findPost(postId)
        const history = await this.getEditHistory(postId)

        return {
            ...post,
            editHistory: history,
            editCount: history.length,
        }
    }

    /**
     * Check if post can be edited by user
     *
     * @param postId - ID of post
     * @param userId - ID of user
     * @returns true if user can edit
     */
    async canEdit(postId: string, userId: string): Promise<boolean> {
        const post = await this.findPost(postId)

        // Cannot edit deleted posts
        if (post.isDeleted) {
            return false
        }

        // Can edit if author
        // In full implementation, would also allow moderators/admins
        return post.authorId === userId
    }

    /**
     * Find post by ID or throw
     *
     * @param postId - ID of post to find
     * @returns Post
     * @throws NotFoundError if post doesn't exist
     */
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
