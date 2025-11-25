import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import {
    type ThreadUpdatePayload,
    type UserRole,
    assertCanUpdate,
    assertIsAdminOrModerator,
    filterUpdateByRole,
} from '@/app/features/threads/models/ThreadUpdate'
import type { ThreadCreationAttributes } from '@/app/features/threads/requests/ThreadCreationRequest'
import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { posts, threads } from '@/config/schema'
import type { Thread } from '@/types'

export class ThreadService {
    public constructor(private readonly database: ForumDatabase) { }

    public async create(authorId: string, attributes: ThreadCreationAttributes): Promise<Thread> {
        const threadId = uuidv7()
        const postId = uuidv7()
        const timestamp = new Date().toISOString()

        // Transaction to ensure thread and initial post are created together
        this.database.transaction((tx: any) => {
            // 1. Create Thread (initially with null lastPostId to avoid FK violation)
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
                lastPostId: null, // Set to null initially
                createdAt: timestamp,
                updatedAt: timestamp,
            }).run()

            // 2. Create Initial Post
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

            // 3. Update Thread with lastPostId
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

    /**
   * Update thread with role-based permissions
   *
   * Demonstrates:
   * - Type Guards for permission checking
   * - Utility Types in practice
   * - Runtime validation with TypeScript
   *
   * @param threadId - ID of thread to update
   * @param userId - ID of user making the update
   * @param userRole - Role of user (user, moderator, admin)
   * @param updateData - Fields to update
   * @returns Updated thread
   * @throws NotFoundError if thread doesn't exist
   * @throws ForbiddenError if user lacks permissions
   */
    public async updateThread(
        threadId: string,
        userId: string,
        userRole: UserRole,
        updateData: ThreadUpdatePayload,
    ): Promise<Thread> {
        // Find thread
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        // Check permissions
        const isAuthor = thread.authorId === userId
        assertCanUpdate(userRole, updateData, isAuthor)

        // Filter updates based on role
        const allowedUpdate = filterUpdateByRole(userRole, updateData)

        // Perform update
        const [updatedThread] = await this.database
            .update(threads)
            .set({
                ...allowedUpdate,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(threads.id, threadId))
            .returning()

        if (!updatedThread) {
            throw new Error('Failed to update thread')
        }

        return updatedThread as Thread
    }

    /**
     * Pin a thread (admin/moderator only)
     *
     * @param threadId - ID of thread to pin
     * @param userRole - Role of user making the request
     * @returns Updated thread
     * @throws ForbiddenError if user is not admin/moderator
     */
    public async pinThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isPinned: true })
    }

    /**
     * Unpin a thread (admin/moderator only)
     *
     * @param threadId - ID of thread to unpin
     * @param userRole - Role of user making the request
     * @returns Updated thread
     * @throws ForbiddenError if user is not admin/moderator
     */
    public async unpinThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isPinned: false })
    }

    /**
     * Lock a thread to prevent new replies (admin/moderator only)
     *
     * @param threadId - ID of thread to lock
     * @param userRole - Role of user making the request
     * @returns Updated thread
     * @throws ForbiddenError if user is not admin/moderator
     */
    public async lockThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isLocked: true })
    }

    /**
     * Unlock a thread (admin/moderator only)
     *
     * @param threadId - ID of thread to unlock
     * @param userRole - Role of user making the request
     * @returns Updated thread
     * @throws ForbiddenError if user is not admin/moderator
     */
    public async unlockThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isLocked: false })
    }

    /**
     * Internal method to update thread status fields
     *
     * @param threadId - ID of thread to update
     * @param update - Status fields to update
     * @returns Updated thread
     * @throws NotFoundError if thread doesn't exist
     */
    private async updateThreadStatus(
        threadId: string,
        update: Partial<Pick<Thread, 'isPinned' | 'isLocked'>>,
    ): Promise<Thread> {
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        const [updatedThread] = await this.database
            .update(threads)
            .set({
                ...update,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(threads.id, threadId))
            .returning()

        if (!updatedThread) {
            throw new Error('Failed to update thread status')
        }

        return updatedThread as Thread
    }

    /**
     * Check if thread is locked
     *
     * @param threadId - ID of thread to check
     * @returns true if thread is locked
     */
    public async isThreadLocked(threadId: string): Promise<boolean> {
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        return thread?.isLocked ?? false
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }
}
